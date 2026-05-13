import { getEnv } from "./env";

export type AdminRole = "super" | "master";

export interface AdminRow {
  id: string;
  login: string;
  password_hash: string;
  role: AdminRole;
  master_id: string | null;
  tg_user_id: number | null;
  display_name: string | null;
  created_at: number;
  updated_at: number;
}

export interface Admin {
  id: string;
  login: string;
  role: AdminRole;
  masterId: string | null;
  tgUserId: number | null;
  displayName: string | null;
  createdAt: number;
}

function row(r: AdminRow): Admin {
  return {
    id: r.id,
    login: r.login,
    role: r.role,
    masterId: r.master_id,
    tgUserId: r.tg_user_id,
    displayName: r.display_name,
    createdAt: r.created_at,
  };
}

async function sha256hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const arr = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < arr.length; i++) out += arr[i].toString(16).padStart(2, "0");
  return out;
}

function uid(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
  );
}

export async function findAdminByLogin(login: string): Promise<AdminRow | null> {
  const { DB } = getEnv();
  return await DB.prepare(`SELECT * FROM admins WHERE login = ?1`)
    .bind(login)
    .first<AdminRow>();
}

export async function findAdminById(id: string): Promise<AdminRow | null> {
  const { DB } = getEnv();
  return await DB.prepare(`SELECT * FROM admins WHERE id = ?1`)
    .bind(id)
    .first<AdminRow>();
}

export async function findAdminByTgUserId(
  tgUserId: number,
): Promise<AdminRow | null> {
  const { DB } = getEnv();
  return await DB.prepare(`SELECT * FROM admins WHERE tg_user_id = ?1`)
    .bind(tgUserId)
    .first<AdminRow>();
}

export async function findMasterAdminForMasterId(
  masterId: string,
): Promise<AdminRow | null> {
  const { DB } = getEnv();
  return await DB.prepare(
    `SELECT * FROM admins WHERE master_id = ?1 LIMIT 1`,
  )
    .bind(masterId)
    .first<AdminRow>();
}

export async function listAdmins(): Promise<Admin[]> {
  const { DB } = getEnv();
  const res = await DB.prepare(
    `SELECT * FROM admins ORDER BY role DESC, created_at ASC`,
  ).all<AdminRow>();
  return (res.results ?? []).map(row);
}

export async function createAdmin(input: {
  login: string;
  password: string;
  role: AdminRole;
  masterId?: string | null;
  tgUserId?: number | null;
  displayName?: string | null;
}): Promise<Admin> {
  const { DB } = getEnv();
  const id = uid();
  const hash = await sha256hex(input.password);
  await DB.prepare(
    `INSERT INTO admins (id, login, password_hash, role, master_id, tg_user_id, display_name)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
  )
    .bind(
      id,
      input.login,
      hash,
      input.role,
      input.masterId ?? null,
      input.tgUserId ?? null,
      input.displayName ?? null,
    )
    .run();
  const r = await findAdminById(id);
  if (!r) throw new Error("admin creation failed");
  return row(r);
}

export async function updateAdmin(input: {
  id: string;
  login?: string;
  password?: string;
  role?: AdminRole;
  masterId?: string | null;
  tgUserId?: number | null;
  displayName?: string | null;
}): Promise<void> {
  const { DB } = getEnv();
  const sets: string[] = [];
  const binds: unknown[] = [];
  let i = 1;
  if (input.login !== undefined) {
    sets.push(`login = ?${i++}`);
    binds.push(input.login);
  }
  if (input.password !== undefined && input.password.length > 0) {
    sets.push(`password_hash = ?${i++}`);
    binds.push(await sha256hex(input.password));
  }
  if (input.role !== undefined) {
    sets.push(`role = ?${i++}`);
    binds.push(input.role);
  }
  if (input.masterId !== undefined) {
    sets.push(`master_id = ?${i++}`);
    binds.push(input.masterId);
  }
  if (input.tgUserId !== undefined) {
    sets.push(`tg_user_id = ?${i++}`);
    binds.push(input.tgUserId);
  }
  if (input.displayName !== undefined) {
    sets.push(`display_name = ?${i++}`);
    binds.push(input.displayName);
  }
  if (sets.length === 0) return;
  sets.push(`updated_at = unixepoch()`);
  binds.push(input.id);
  await DB.prepare(`UPDATE admins SET ${sets.join(", ")} WHERE id = ?${i}`)
    .bind(...binds)
    .run();
}

export async function deleteAdmin(id: string): Promise<void> {
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM admins WHERE id = ?1`).bind(id).run();
  await DB.prepare(`DELETE FROM admin_sessions WHERE admin_id = ?1`).bind(id).run();
}

// ---------- sessions ----------

const SESSION_TTL_SEC = 14 * 24 * 60 * 60; // 14 days

export async function loginAdmin(
  login: string,
  password: string,
): Promise<{ token: string; admin: Admin } | null> {
  const r = await findAdminByLogin(login);
  if (!r) return null;
  const hash = await sha256hex(password);
  if (hash !== r.password_hash) return null;
  const token = uid() + uid();
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const { DB } = getEnv();
  await DB.prepare(
    `INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (?1, ?2, ?3)`,
  )
    .bind(token, r.id, expires)
    .run();
  return { token, admin: row(r) };
}

export async function getAdminBySession(token: string): Promise<Admin | null> {
  if (!token) return null;
  const { DB } = getEnv();
  const s = await DB.prepare(
    `SELECT a.* FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
     WHERE s.token = ?1 AND s.expires_at > unixepoch()`,
  )
    .bind(token)
    .first<AdminRow>();
  return s ? row(s) : null;
}

export async function logoutAdmin(token: string): Promise<void> {
  if (!token) return;
  const { DB } = getEnv();
  await DB.prepare(`DELETE FROM admin_sessions WHERE token = ?1`).bind(token).run();
}

// ---------- bootstrap (super admin from env) ----------

/**
 * Ensures a super admin exists with the env-provided ADMIN_PASSWORD as
 * password and login "admin". Idempotent.
 */
export async function ensureSuperAdmin(): Promise<void> {
  const { DB } = getEnv();
  const env = getEnv();
  const pass = env.ADMIN_PASSWORD ?? "";
  if (!pass) return;
  const existing = await DB.prepare(
    `SELECT id, password_hash FROM admins WHERE login = 'admin'`,
  ).first<{ id: string; password_hash: string }>();
  const hash = await sha256hex(pass);
  if (!existing) {
    await DB.prepare(
      `INSERT INTO admins (id, login, password_hash, role, display_name)
       VALUES (?1, 'admin', ?2, 'super', 'Super Admin')`,
    )
      .bind(uid(), hash)
      .run();
  } else if (existing.password_hash !== hash) {
    // Keep super-admin password in sync with secret if changed.
    await DB.prepare(
      `UPDATE admins SET password_hash = ?1, updated_at = unixepoch() WHERE id = ?2`,
    )
      .bind(hash, existing.id)
      .run();
  }
}
