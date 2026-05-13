import { getEnv } from "./env";

// ===== Row types (DB shape) =====
export interface DbBranch {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  image: string;
  distance_km: number;
  sort_order: number;
  active: number;
  name_uz?: string | null;
  address_uz?: string | null;
  hours_uz?: string | null;
}

export interface DbService {
  id: string;
  category: string;
  title: string;
  duration_min: number;
  price: number;
  image: string;
  description: string;
  popular: number;
  sort_order: number;
  active: number;
  title_uz?: string | null;
  description_uz?: string | null;
}

export interface DbMaster {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  years_exp: number;
  service_ids: string;
  branch_ids: string;
  active: number;
  work_hours?: string;
  commission_pct?: number;
  name_uz?: string | null;
  role_uz?: string | null;
}

export interface DbPromo {
  id: string;
  title: string;
  description: string;
  badge: string;
  valid_until: string;
  image: string;
  active: number;
  sort_order: number;
  discount_pct?: number;
  service_ids?: string;
  title_uz?: string | null;
  description_uz?: string | null;
  badge_uz?: string | null;
  valid_until_uz?: string | null;
}

// ===== Client types (camelCase, parsed arrays) =====
export type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  image: string;
  distanceKm: number;
  nameUz?: string;
  addressUz?: string;
  hoursUz?: string;
};

export type Service = {
  id: string;
  category: string;
  title: string;
  durationMin: number;
  price: number;
  image: string;
  description: string;
  popular: boolean;
  titleUz?: string;
  descriptionUz?: string;
};

export type WorkHours = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", string>
>;
export type Master = {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  yearsExp: number;
  serviceIds: string[];
  branchIds: string[];
  workHours?: WorkHours;
  commissionPct?: number;
  nameUz?: string;
  roleUz?: string;
};

export type Promo = {
  id: string;
  title: string;
  description: string;
  badge: string;
  validUntil: string;
  image: string;
  /** Real discount %. 0 = visual-only promo (no auto discount). */
  discountPct: number;
  /** Services this promo applies to. Empty = all services. */
  serviceIds: string[];
  titleUz?: string;
  descriptionUz?: string;
  badgeUz?: string;
  validUntilUz?: string;
};

// ===== Mappers =====
function safeJson(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

const branchFromRow = (r: DbBranch): Branch => ({
  id: r.id,
  name: r.name,
  address: r.address,
  phone: r.phone,
  hours: r.hours,
  image: r.image,
  distanceKm: r.distance_km,
  nameUz: r.name_uz ?? undefined,
  addressUz: r.address_uz ?? undefined,
  hoursUz: r.hours_uz ?? undefined,
});

const serviceFromRow = (r: DbService): Service => ({
  id: r.id,
  category: r.category,
  title: r.title,
  durationMin: r.duration_min,
  price: r.price,
  image: r.image,
  description: r.description,
  popular: r.popular === 1,
  titleUz: r.title_uz ?? undefined,
  descriptionUz: r.description_uz ?? undefined,
});

function safeJsonObj(s: string | undefined): WorkHours {
  if (!s) return {};
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

const masterFromRow = (r: DbMaster): Master => ({
  id: r.id,
  name: r.name,
  role: r.role,
  image: r.image,
  rating: r.rating,
  yearsExp: r.years_exp,
  serviceIds: safeJson(r.service_ids),
  branchIds: safeJson(r.branch_ids),
  workHours: safeJsonObj(r.work_hours),
  commissionPct: r.commission_pct ?? 40,
  nameUz: r.name_uz ?? undefined,
  roleUz: r.role_uz ?? undefined,
});

const promoFromRow = (r: DbPromo): Promo => ({
  id: r.id,
  title: r.title,
  description: r.description,
  badge: r.badge,
  validUntil: r.valid_until,
  image: r.image,
  discountPct: r.discount_pct ?? 0,
  serviceIds: r.service_ids ? safeJson(r.service_ids) : [],
  titleUz: r.title_uz ?? undefined,
  descriptionUz: r.description_uz ?? undefined,
  badgeUz: r.badge_uz ?? undefined,
  validUntilUz: r.valid_until_uz ?? undefined,
});

// ===== Reads =====
export async function listBranches(): Promise<Branch[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM branches WHERE active = 1 ORDER BY sort_order, name`,
  ).all<DbBranch>();
  return (r.results ?? []).map(branchFromRow);
}

export async function listServices(): Promise<Service[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM services WHERE active = 1 ORDER BY sort_order, title`,
  ).all<DbService>();
  return (r.results ?? []).map(serviceFromRow);
}

export async function listMasters(): Promise<Master[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM masters WHERE active = 1 ORDER BY name`,
  ).all<DbMaster>();
  return (r.results ?? []).map(masterFromRow);
}

export async function listPromos(): Promise<Promo[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM promos WHERE active = 1 ORDER BY sort_order, id`,
  ).all<DbPromo>();
  return (r.results ?? []).map(promoFromRow);
}

// ===== Mutations =====
function uid(prefix: string) {
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function upsertBranch(b: Branch): Promise<void> {
  const { DB } = getEnv();
  const id = b.id || uid("b");
  await DB.prepare(
    `INSERT INTO branches (id, name, address, phone, hours, image, distance_km, name_uz, address_uz, hours_uz, sort_order, active, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, 1, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       address = excluded.address,
       phone = excluded.phone,
       hours = excluded.hours,
       image = excluded.image,
       distance_km = excluded.distance_km,
       name_uz = excluded.name_uz,
       address_uz = excluded.address_uz,
       hours_uz = excluded.hours_uz,
       updated_at = unixepoch()`,
  )
    .bind(
      id,
      b.name,
      b.address,
      b.phone,
      b.hours,
      b.image,
      b.distanceKm,
      b.nameUz ?? null,
      b.addressUz ?? null,
      b.hoursUz ?? null,
    )
    .run();
}

export async function deleteBranch(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM branches WHERE id = ?1`).bind(id).run();
}

export async function upsertService(s: Service): Promise<void> {
  const { DB } = getEnv();
  const id = s.id || uid("s");
  await DB.prepare(
    `INSERT INTO services (id, category, title, duration_min, price, image, description, popular, title_uz, description_uz, sort_order, active, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 0, 1, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       category = excluded.category,
       title = excluded.title,
       duration_min = excluded.duration_min,
       price = excluded.price,
       image = excluded.image,
       description = excluded.description,
       popular = excluded.popular,
       title_uz = excluded.title_uz,
       description_uz = excluded.description_uz,
       updated_at = unixepoch()`,
  )
    .bind(
      id,
      s.category,
      s.title,
      s.durationMin,
      s.price,
      s.image,
      s.description,
      s.popular ? 1 : 0,
      s.titleUz ?? null,
      s.descriptionUz ?? null,
    )
    .run();
}

export async function deleteService(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM services WHERE id = ?1`).bind(id).run();
}

export async function upsertMaster(m: Master): Promise<void> {
  const { DB } = getEnv();
  const id = m.id || uid("m");
  await DB.prepare(
    `INSERT INTO masters (id, name, role, image, rating, years_exp, service_ids, branch_ids, work_hours, commission_pct, name_uz, role_uz, active, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       role = excluded.role,
       image = excluded.image,
       rating = excluded.rating,
       years_exp = excluded.years_exp,
       service_ids = excluded.service_ids,
       branch_ids = excluded.branch_ids,
       work_hours = excluded.work_hours,
       commission_pct = excluded.commission_pct,
       name_uz = excluded.name_uz,
       role_uz = excluded.role_uz,
       updated_at = unixepoch()`,
  )
    .bind(
      id,
      m.name,
      m.role,
      m.image,
      m.rating,
      m.yearsExp,
      JSON.stringify(m.serviceIds),
      JSON.stringify(m.branchIds),
      JSON.stringify(m.workHours ?? {}),
      m.commissionPct ?? 40,
      m.nameUz ?? null,
      m.roleUz ?? null,
    )
    .run();
}

export async function deleteMaster(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM masters WHERE id = ?1`).bind(id).run();
}

export async function upsertPromo(p: Promo): Promise<void> {
  const { DB } = getEnv();
  const id = p.id || uid("p");
  await DB.prepare(
    `INSERT INTO promos (id, title, description, badge, valid_until, image, discount_pct, service_ids, title_uz, description_uz, badge_uz, valid_until_uz, active, sort_order, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1, 0, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       badge = excluded.badge,
       valid_until = excluded.valid_until,
       image = excluded.image,
       discount_pct = excluded.discount_pct,
       service_ids = excluded.service_ids,
       title_uz = excluded.title_uz,
       description_uz = excluded.description_uz,
       badge_uz = excluded.badge_uz,
       valid_until_uz = excluded.valid_until_uz,
       updated_at = unixepoch()`,
  )
    .bind(
      id,
      p.title,
      p.description,
      p.badge,
      p.validUntil,
      p.image,
      Math.max(0, Math.min(100, p.discountPct ?? 0)),
      JSON.stringify(p.serviceIds ?? []),
      p.titleUz ?? null,
      p.descriptionUz ?? null,
      p.badgeUz ?? null,
      p.validUntilUz ?? null,
    )
    .run();
}

export async function deletePromo(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM promos WHERE id = ?1`).bind(id).run();
}

// ===== Slot locks =====
export type SlotLockResult =
  | { ok: true; key: string }
  | { ok: false; reason: "locked" | "booked" };

const LOCK_TTL_SEC = 5 * 60;

export async function tryLockSlot(
  branchId: string,
  masterId: string,
  date: string,
  time: string,
  sessionId: string,
  prevKey?: string,
): Promise<SlotLockResult> {
  const { DB } = getEnv();
  const key = `${branchId}|${masterId}|${date}|${time}`;
  const now = Math.floor(Date.now() / 1000);
  const expires = now + LOCK_TTL_SEC;

  // Release previous lock from same session (best-effort).
  if (prevKey && prevKey !== key) {
    await DB.prepare(
      `DELETE FROM slot_locks WHERE key = ?1 AND session_id = ?2`,
    )
      .bind(prevKey, sessionId)
      .run()
      .catch(() => {});
  }

  // Insert or update — only if no live lock by someone else.
  // SQLite UPSERT with conditional: if existing row has expires_at > now AND session_id != ours, fail.
  const existing = await DB.prepare(
    `SELECT session_id, expires_at FROM slot_locks WHERE key = ?1`,
  )
    .bind(key)
    .first<{ session_id: string; expires_at: number }>();

  if (existing && existing.expires_at > now && existing.session_id !== sessionId) {
    return { ok: false, reason: "locked" };
  }

  await DB.prepare(
    `INSERT INTO slot_locks (key, session_id, expires_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(key) DO UPDATE SET session_id = ?2, expires_at = ?3`,
  )
    .bind(key, sessionId, expires)
    .run();

  return { ok: true, key };
}

export async function refreshLockServer(
  key: string,
  sessionId: string,
): Promise<boolean> {
  const { DB } = getEnv();
  const expires = Math.floor(Date.now() / 1000) + LOCK_TTL_SEC;
  const r = await DB.prepare(
    `UPDATE slot_locks SET expires_at = ?1 WHERE key = ?2 AND session_id = ?3`,
  )
    .bind(expires, key, sessionId)
    .run();
  return !!r.success;
}

export async function releaseLockServer(
  key: string,
  sessionId: string,
): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `DELETE FROM slot_locks WHERE key = ?1 AND session_id = ?2`,
  )
    .bind(key, sessionId)
    .run();
}

export async function confirmLockServer(
  key: string,
  sessionId: string,
): Promise<boolean> {
  const { DB } = getEnv();
  const now = Math.floor(Date.now() / 1000);
  const r = await DB.prepare(
    `DELETE FROM slot_locks WHERE key = ?1 AND session_id = ?2 AND expires_at > ?3`,
  )
    .bind(key, sessionId, now)
    .run();
  // If we successfully deleted our lock, confirmation succeeded.
  return !!r.success;
}

export type SlotLockMap = Map<string, { sessionId: string; expiresAt: number }>;

/**
 * Snapshot of active locks for a branch+date. Used by the UI to render
 * grey "locked by someone else" / yellow "yours" slots.
 */
export async function getLocksFor(
  branchId: string,
  date: string,
): Promise<SlotLockMap> {
  const { DB } = getEnv();
  const now = Math.floor(Date.now() / 1000);
  const r = await DB.prepare(
    `SELECT key, session_id, expires_at FROM slot_locks
       WHERE expires_at > ?1 AND key LIKE ?2`,
  )
    .bind(now, `${branchId}|%|${date}|%`)
    .all<{ key: string; session_id: string; expires_at: number }>();
  const map: SlotLockMap = new Map();
  (r.results ?? []).forEach((row) => {
    map.set(row.key, {
      sessionId: row.session_id,
      expiresAt: row.expires_at,
    });
  });
  return map;
}

/**
 * Already-booked slots: a booking exists with confirmed/upcoming status whose
 * master+date+time matches our slot key.
 */
export async function getBookedSlotKeys(
  branchId: string,
  date: string,
): Promise<Set<string>> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT master_id, start_at FROM bookings
       WHERE branch_id = ?1
         AND status IN ('upcoming', 'confirmed')
         AND substr(start_at, 1, 10) = ?2`,
  )
    .bind(branchId, date)
    .all<{ master_id: string | null; start_at: string }>();
  const set = new Set<string>();
  (r.results ?? []).forEach((row) => {
    if (!row.master_id) return;
    const time = row.start_at.slice(11, 16); // "HH:mm"
    set.add(`${branchId}|${row.master_id}|${date}|${time}`);
  });
  return set;
}
