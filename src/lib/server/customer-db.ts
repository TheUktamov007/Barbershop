import { getEnv } from "./env";

export type Tier = "bronze" | "silver" | "gold" | "platinum";

export type CustomerProfile = {
  tgUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
  phone?: string;
  bonusPoints: number;
  totalSpent: number;
  visitsCount: number;
  birthday?: string;
  referredBy?: number;
  adminNote?: string;
  favoriteMasters: string[];
  referralCode?: string;
};

type DbCustomer = {
  tg_user_id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  photo_url: string | null;
  language_code: string | null;
  phone: string | null;
  bonus_points: number;
  total_spent: number;
  visits_count: number;
  birthday: string | null;
  referred_by: number | null;
  admin_note: string | null;
  favorite_masters: string | null;
  referral_code: string | null;
};

function parseJsonArr(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

const fromRow = (r: DbCustomer): CustomerProfile => ({
  tgUserId: r.tg_user_id,
  firstName: r.first_name ?? undefined,
  lastName: r.last_name ?? undefined,
  username: r.username ?? undefined,
  photoUrl: r.photo_url ?? undefined,
  languageCode: r.language_code ?? undefined,
  phone: r.phone ?? undefined,
  bonusPoints: r.bonus_points,
  totalSpent: r.total_spent,
  visitsCount: r.visits_count,
  birthday: r.birthday ?? undefined,
  referredBy: r.referred_by ?? undefined,
  adminNote: r.admin_note ?? undefined,
  favoriteMasters: parseJsonArr(r.favorite_masters),
  referralCode: r.referral_code ?? undefined,
});

function genReferralCode(tgUserId: number): string {
  // Short, URL-safe, deterministic-ish.
  return (tgUserId.toString(36) + Math.random().toString(36).slice(2, 6)).slice(0, 8);
}

export async function ensureReferralCode(
  tgUserId: number,
): Promise<string> {
  const { DB } = getEnv();
  const row = await DB.prepare(
    `SELECT referral_code FROM customers WHERE tg_user_id = ?1`,
  )
    .bind(tgUserId)
    .first<{ referral_code: string | null }>();
  if (row?.referral_code) return row.referral_code;
  const code = genReferralCode(tgUserId);
  await DB.prepare(
    `UPDATE customers SET referral_code = ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(code, tgUserId)
    .run();
  return code;
}

export async function findCustomerByReferralCode(
  code: string,
): Promise<CustomerProfile | null> {
  const { DB } = getEnv();
  const row = await DB.prepare(
    `SELECT * FROM customers WHERE referral_code = ?1 LIMIT 1`,
  )
    .bind(code)
    .first<DbCustomer>();
  return row ? fromRow(row) : null;
}

export async function setReferrer(
  tgUserId: number,
  referrerId: number,
): Promise<void> {
  const { DB } = getEnv();
  // Only set if not already set (and not self).
  if (tgUserId === referrerId) return;
  await DB.prepare(
    `UPDATE customers SET referred_by = ?1, updated_at = unixepoch()
       WHERE tg_user_id = ?2 AND referred_by IS NULL`,
  )
    .bind(referrerId, tgUserId)
    .run();
}

export async function toggleFavoriteMaster(
  tgUserId: number,
  masterId: string,
): Promise<string[]> {
  const cust = await getCustomer(tgUserId);
  if (!cust) return [];
  const cur = new Set(cust.favoriteMasters);
  if (cur.has(masterId)) cur.delete(masterId);
  else cur.add(masterId);
  const next = Array.from(cur);
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE customers SET favorite_masters = ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(JSON.stringify(next), tgUserId)
    .run();
  return next;
}

export async function awardReferralBonuses(
  refereeId: number,
  referrerId: number,
  amount = 50000,
): Promise<void> {
  const { DB } = getEnv();
  // Award once per referee — track in bonus_txns with reason='referral'.
  const existing = await DB.prepare(
    `SELECT id FROM bonus_txns WHERE tg_user_id = ?1 AND reason = 'referral' LIMIT 1`,
  )
    .bind(refereeId)
    .first<{ id: number }>();
  if (existing) return;
  // Credit both.
  await DB.batch([
    DB.prepare(
      `UPDATE customers SET bonus_points = bonus_points + ?1 WHERE tg_user_id = ?2`,
    ).bind(amount, refereeId),
    DB.prepare(
      `UPDATE customers SET bonus_points = bonus_points + ?1 WHERE tg_user_id = ?2`,
    ).bind(amount, referrerId),
    DB.prepare(
      `INSERT INTO bonus_txns (tg_user_id, delta, reason) VALUES (?1, ?2, 'referral')`,
    ).bind(refereeId, amount),
    DB.prepare(
      `INSERT INTO bonus_txns (tg_user_id, delta, reason) VALUES (?1, ?2, 'referral')`,
    ).bind(referrerId, amount),
  ]);
}

export async function listAllCustomers(): Promise<CustomerProfile[]> {
  const { DB } = getEnv();
  const res = await DB.prepare(
    `SELECT * FROM customers ORDER BY updated_at DESC LIMIT 500`,
  ).all<DbCustomer>();
  return (res.results ?? []).map(fromRow);
}

export async function setCustomerAdminNote(
  tgUserId: number,
  note: string | null,
): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE customers SET admin_note = ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(note, tgUserId)
    .run();
}

// Tier thresholds. Tweak in admin later.
const TIER_VISITS = { silver: 3, gold: 10, platinum: 25 } as const;

export function tierOf(profile: { visitsCount: number }): Tier {
  if (profile.visitsCount >= TIER_VISITS.platinum) return "platinum";
  if (profile.visitsCount >= TIER_VISITS.gold) return "gold";
  if (profile.visitsCount >= TIER_VISITS.silver) return "silver";
  return "bronze";
}

export function cashbackPctFor(tier: Tier): number {
  switch (tier) {
    case "platinum":
      return 15;
    case "gold":
      return 12;
    case "silver":
      return 8;
    default:
      return 5;
  }
}

export function tierLabel(tier: Tier): string {
  return tier[0].toUpperCase() + tier.slice(1);
}

export function nextTierGoal(tier: Tier, visitsCount: number): {
  next: Tier | null;
  visitsToGo: number;
} {
  if (tier === "platinum") return { next: null, visitsToGo: 0 };
  if (tier === "gold") return { next: "platinum", visitsToGo: TIER_VISITS.platinum - visitsCount };
  if (tier === "silver") return { next: "gold", visitsToGo: TIER_VISITS.gold - visitsCount };
  return { next: "silver", visitsToGo: TIER_VISITS.silver - visitsCount };
}

export async function getOrCreateCustomer(input: {
  tgUserId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  languageCode?: string;
}): Promise<CustomerProfile> {
  const { DB } = getEnv();
  await DB.prepare(
    `INSERT INTO customers (tg_user_id, first_name, last_name, username, photo_url, language_code, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, unixepoch())
     ON CONFLICT(tg_user_id) DO UPDATE SET
       first_name = COALESCE(excluded.first_name, customers.first_name),
       last_name = COALESCE(excluded.last_name, customers.last_name),
       username = COALESCE(excluded.username, customers.username),
       photo_url = COALESCE(excluded.photo_url, customers.photo_url),
       language_code = COALESCE(excluded.language_code, customers.language_code),
       updated_at = unixepoch()`,
  )
    .bind(
      input.tgUserId,
      input.firstName ?? null,
      input.lastName ?? null,
      input.username ?? null,
      input.photoUrl ?? null,
      input.languageCode ?? null,
    )
    .run();

  const row = await DB.prepare(
    `SELECT * FROM customers WHERE tg_user_id = ?1`,
  )
    .bind(input.tgUserId)
    .first<DbCustomer>();
  if (!row) throw new Error("customer upsert failed");
  return fromRow(row);
}

export async function getCustomer(
  tgUserId: number,
): Promise<CustomerProfile | null> {
  const { DB } = getEnv();
  const row = await DB.prepare(
    `SELECT * FROM customers WHERE tg_user_id = ?1`,
  )
    .bind(tgUserId)
    .first<DbCustomer>();
  return row ? fromRow(row) : null;
}

export async function setCustomerBirthday(
  tgUserId: number,
  birthday: string | null,
): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE customers SET birthday = ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(birthday, tgUserId)
    .run();
}

export async function setCustomerPhone(
  tgUserId: number,
  phone: string,
): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE customers SET phone = ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(phone, tgUserId)
    .run();
}

/**
 * Award bonus points on booking completion. Idempotent — guarded by
 * bookings.bonus_accrued flag.
 */
export async function maybeAccrueBonus(bookingId: string): Promise<{
  awarded: number;
  customer: CustomerProfile | null;
} | null> {
  const { DB } = getEnv();
  const b = await DB.prepare(
    `SELECT id, tg_user_id, price, bonus_accrued, status, bonus_used
       FROM bookings WHERE id = ?1`,
  )
    .bind(bookingId)
    .first<{
      id: string;
      tg_user_id: number | null;
      price: number;
      bonus_accrued: number;
      status: string;
      bonus_used: number;
    }>();
  if (!b) return null;
  if (b.status !== "completed") return null;
  if (b.bonus_accrued === 1) return null;
  if (!b.tg_user_id) return null;

  const cust = await getCustomer(b.tg_user_id);
  if (!cust) return null;
  const tier = tierOf(cust);
  const pct = cashbackPctFor(tier);
  const netPaid = b.price - (b.bonus_used ?? 0);
  const award = Math.max(0, Math.floor((netPaid * pct) / 100));

  await DB.prepare(
    `UPDATE customers
       SET bonus_points = bonus_points + ?1,
           total_spent = total_spent + ?2,
           visits_count = visits_count + 1,
           updated_at = unixepoch()
     WHERE tg_user_id = ?3`,
  )
    .bind(award, netPaid, b.tg_user_id)
    .run();

  await DB.prepare(
    `INSERT INTO bonus_txns (tg_user_id, delta, reason, booking_id) VALUES (?1, ?2, 'visit', ?3)`,
  )
    .bind(b.tg_user_id, award, bookingId)
    .run();

  await DB.prepare(
    `UPDATE bookings SET bonus_accrued = 1, updated_at = unixepoch() WHERE id = ?1`,
  )
    .bind(bookingId)
    .run();

  const refreshed = await getCustomer(b.tg_user_id);
  return { awarded: award, customer: refreshed };
}

/**
 * Spend bonus points on a booking. Returns how many were actually deducted
 * (clamped to customer balance and a max 50% of price).
 */
export async function spendBonusForBooking(
  tgUserId: number,
  bookingId: string,
  requestedAmount: number,
  bookingPrice: number,
): Promise<number> {
  const { DB } = getEnv();
  const cust = await getCustomer(tgUserId);
  if (!cust) return 0;
  const maxByPrice = Math.floor(bookingPrice / 2);
  const amount = Math.max(
    0,
    Math.min(requestedAmount, cust.bonusPoints, maxByPrice),
  );
  if (amount === 0) return 0;
  await DB.prepare(
    `UPDATE customers SET bonus_points = bonus_points - ?1, updated_at = unixepoch() WHERE tg_user_id = ?2`,
  )
    .bind(amount, tgUserId)
    .run();
  await DB.prepare(
    `UPDATE bookings SET bonus_used = ?1, updated_at = unixepoch() WHERE id = ?2`,
  )
    .bind(amount, bookingId)
    .run();
  await DB.prepare(
    `INSERT INTO bonus_txns (tg_user_id, delta, reason, booking_id) VALUES (?1, ?2, 'spend', ?3)`,
  )
    .bind(tgUserId, -amount, bookingId)
    .run();
  return amount;
}

/**
 * Users whose birthday is today and we haven't sent them the BD greeting yet.
 * Uses a side table to track sends per (user, year) so the cron is idempotent.
 */
export async function listBirthdaysToday(): Promise<CustomerProfile[]> {
  const { DB } = getEnv();
  const now = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const year = now.getUTCFullYear();
  // Ensure the tracker table exists (lazy init — avoids extra migration).
  await DB.prepare(
    `CREATE TABLE IF NOT EXISTS birthday_sent (
       tg_user_id INTEGER NOT NULL,
       year INTEGER NOT NULL,
       sent_at INTEGER NOT NULL DEFAULT (unixepoch()),
       PRIMARY KEY (tg_user_id, year)
     )`,
  ).run();
  const res = await DB.prepare(
    `SELECT c.* FROM customers c
       LEFT JOIN birthday_sent b ON b.tg_user_id = c.tg_user_id AND b.year = ?1
       WHERE c.birthday IS NOT NULL
         AND substr(c.birthday, 6, 5) = ?2
         AND b.tg_user_id IS NULL`,
  )
    .bind(year, mmdd)
    .all<DbCustomer>();
  return (res.results ?? []).map(fromRow);
}

export async function markBirthdaySent(
  tgUserId: number,
  year: number,
): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `INSERT OR IGNORE INTO birthday_sent (tg_user_id, year) VALUES (?1, ?2)`,
  )
    .bind(tgUserId, year)
    .run();
}
