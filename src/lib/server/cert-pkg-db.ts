import { getEnv } from "./env";

export type Certificate = {
  id: string;
  code: string;
  amountInitial: number;
  amountBalance: number;
  ownerTgId?: number;
  giftedByTgId?: number;
  note?: string;
  expiresAt?: string;
  status: "active" | "spent" | "revoked";
  createdAt: number;
};

type DbCert = {
  id: string;
  code: string;
  amount_initial: number;
  amount_balance: number;
  owner_tg_id: number | null;
  gifted_by_tg_id: number | null;
  note: string | null;
  expires_at: string | null;
  status: "active" | "spent" | "revoked";
  created_at: number;
};

const certFromRow = (r: DbCert): Certificate => ({
  id: r.id,
  code: r.code,
  amountInitial: r.amount_initial,
  amountBalance: r.amount_balance,
  ownerTgId: r.owner_tg_id ?? undefined,
  giftedByTgId: r.gifted_by_tg_id ?? undefined,
  note: r.note ?? undefined,
  expiresAt: r.expires_at ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

function uid(prefix: string) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

function genCertCode() {
  // Human-friendly: BRAVO-XXXXXX (uppercase alphanum, no 0/O/1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "BRAVO-";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createCertificate(input: {
  amount: number;
  ownerTgId?: number;
  giftedByTgId?: number;
  note?: string;
  expiresAt?: string;
}): Promise<Certificate> {
  const { DB } = getEnv();
  const id = uid("cert");
  // Retry on collision (super unlikely).
  let code = genCertCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await DB.prepare(
      `SELECT 1 AS x FROM certificates WHERE code = ?1`,
    )
      .bind(code)
      .first<{ x: number }>();
    if (!exists) break;
    code = genCertCode();
  }
  await DB.prepare(
    `INSERT INTO certificates (id, code, amount_initial, amount_balance, owner_tg_id, gifted_by_tg_id, note, expires_at)
     VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?7)`,
  )
    .bind(
      id,
      code,
      input.amount,
      input.ownerTgId ?? null,
      input.giftedByTgId ?? null,
      input.note ?? null,
      input.expiresAt ?? null,
    )
    .run();
  const row = await DB.prepare(`SELECT * FROM certificates WHERE id = ?1`)
    .bind(id)
    .first<DbCert>();
  if (!row) throw new Error("cert insert failed");
  return certFromRow(row);
}

export async function listCertificatesAll(): Promise<Certificate[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM certificates ORDER BY created_at DESC LIMIT 500`,
  ).all<DbCert>();
  return (r.results ?? []).map(certFromRow);
}

export async function listCertificatesForUser(
  tgUserId: number,
): Promise<Certificate[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM certificates WHERE owner_tg_id = ?1 AND status = 'active' AND amount_balance > 0
       ORDER BY created_at DESC`,
  )
    .bind(tgUserId)
    .all<DbCert>();
  return (r.results ?? []).map(certFromRow);
}

export async function findCertByCode(code: string): Promise<Certificate | null> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM certificates WHERE code = ?1 LIMIT 1`,
  )
    .bind(code.trim().toUpperCase())
    .first<DbCert>();
  return r ? certFromRow(r) : null;
}

export async function spendCertificate(
  certId: string,
  bookingId: string,
  amount: number,
): Promise<number> {
  const { DB } = getEnv();
  const cert = await DB.prepare(
    `SELECT amount_balance, status, expires_at FROM certificates WHERE id = ?1`,
  )
    .bind(certId)
    .first<{ amount_balance: number; status: string; expires_at: string | null }>();
  if (!cert || cert.status !== "active") return 0;
  if (cert.expires_at && cert.expires_at < new Date().toISOString().slice(0, 10)) return 0;
  const toSpend = Math.max(0, Math.min(amount, cert.amount_balance));
  if (toSpend === 0) return 0;
  const newBal = cert.amount_balance - toSpend;
  const newStatus = newBal <= 0 ? "spent" : "active";
  await DB.prepare(
    `UPDATE certificates SET amount_balance = ?1, status = ?2 WHERE id = ?3`,
  )
    .bind(newBal, newStatus, certId)
    .run();
  await DB.prepare(
    `UPDATE bookings SET cert_id = ?1, cert_amount = ?2 WHERE id = ?3`,
  )
    .bind(certId, toSpend, bookingId)
    .run();
  return toSpend;
}

export async function revokeCertificate(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE certificates SET status = 'revoked' WHERE id = ?1`,
  )
    .bind(id)
    .run();
}

/* ===== Packages ===== */

export type Package = {
  id: string;
  ownerTgId: number;
  title: string;
  serviceId?: string;
  category?: string;
  totalVisits: number;
  usedVisits: number;
  expiresAt?: string;
  status: "active" | "depleted" | "expired" | "revoked";
  createdAt: number;
};

type DbPkg = {
  id: string;
  owner_tg_id: number;
  title: string;
  service_id: string | null;
  category: string | null;
  total_visits: number;
  used_visits: number;
  expires_at: string | null;
  status: "active" | "depleted" | "expired" | "revoked";
  created_at: number;
};

const pkgFromRow = (r: DbPkg): Package => ({
  id: r.id,
  ownerTgId: r.owner_tg_id,
  title: r.title,
  serviceId: r.service_id ?? undefined,
  category: r.category ?? undefined,
  totalVisits: r.total_visits,
  usedVisits: r.used_visits,
  expiresAt: r.expires_at ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

export async function createPackage(input: {
  ownerTgId: number;
  title: string;
  serviceId?: string;
  category?: string;
  totalVisits: number;
  expiresAt?: string;
}): Promise<Package> {
  const { DB } = getEnv();
  const id = uid("pkg");
  await DB.prepare(
    `INSERT INTO packages (id, owner_tg_id, title, service_id, category, total_visits, used_visits, expires_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7)`,
  )
    .bind(
      id,
      input.ownerTgId,
      input.title,
      input.serviceId ?? null,
      input.category ?? null,
      input.totalVisits,
      input.expiresAt ?? null,
    )
    .run();
  const row = await DB.prepare(`SELECT * FROM packages WHERE id = ?1`)
    .bind(id)
    .first<DbPkg>();
  if (!row) throw new Error("pkg insert failed");
  return pkgFromRow(row);
}

export async function listPackagesAll(): Promise<Package[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM packages ORDER BY created_at DESC LIMIT 500`,
  ).all<DbPkg>();
  return (r.results ?? []).map(pkgFromRow);
}

export async function listPackagesForUser(
  tgUserId: number,
): Promise<Package[]> {
  const { DB } = getEnv();
  const r = await DB.prepare(
    `SELECT * FROM packages
       WHERE owner_tg_id = ?1 AND status = 'active' AND used_visits < total_visits
       ORDER BY created_at DESC`,
  )
    .bind(tgUserId)
    .all<DbPkg>();
  return (r.results ?? []).map(pkgFromRow);
}

export async function usePackageVisit(
  pkgId: string,
  bookingId: string,
): Promise<boolean> {
  const { DB } = getEnv();
  const p = await DB.prepare(
    `SELECT used_visits, total_visits, status, expires_at FROM packages WHERE id = ?1`,
  )
    .bind(pkgId)
    .first<{ used_visits: number; total_visits: number; status: string; expires_at: string | null }>();
  if (!p || p.status !== "active") return false;
  if (p.expires_at && p.expires_at < new Date().toISOString().slice(0, 10)) return false;
  if (p.used_visits >= p.total_visits) return false;
  const newUsed = p.used_visits + 1;
  const newStatus = newUsed >= p.total_visits ? "depleted" : "active";
  await DB.prepare(
    `UPDATE packages SET used_visits = ?1, status = ?2 WHERE id = ?3`,
  )
    .bind(newUsed, newStatus, pkgId)
    .run();
  await DB.prepare(
    `UPDATE bookings SET package_id = ?1 WHERE id = ?2`,
  )
    .bind(pkgId, bookingId)
    .run();
  return true;
}

export async function revokePackage(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(
    `UPDATE packages SET status = 'revoked' WHERE id = ?1`,
  )
    .bind(id)
    .run();
}
