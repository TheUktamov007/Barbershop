import { validateInitData } from "../telegram-server";
import { getEnv } from "./env";
import {
  ensureSuperAdmin,
  findAdminByTgUserId,
  getAdminBySession,
  type Admin,
} from "./admin-db";

/**
 * Set of admin TG IDs. Includes ADMIN_TELEGRAM_ID (primary) + any IDs from
 * ADMIN_TELEGRAM_IDS (comma-separated). Used for multi-admin support.
 */
function adminIdSet(): Set<string> {
  const env = getEnv();
  const ids = new Set<string>();
  if (env.ADMIN_TELEGRAM_ID) ids.add(String(env.ADMIN_TELEGRAM_ID).trim());
  if (env.ADMIN_TELEGRAM_IDS) {
    for (const id of env.ADMIN_TELEGRAM_IDS.split(",")) {
      const t = id.trim();
      if (t) ids.add(t);
    }
  }
  return ids;
}

export function isAdminId(tgUserId: number | string | undefined | null): boolean {
  if (tgUserId == null) return false;
  return adminIdSet().has(String(tgUserId));
}

export type AdminCreds = {
  initData?: string;
  /** Server-side admin password. Sent from browser fallback flow. */
  adminPass?: string;
  /** Session token from admin login form. */
  sessionToken?: string;
};

export type AdminAuthResult = {
  ok: boolean;
  isAdmin: boolean;
  user: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
  } | null;
  via: "telegram" | "password" | "session" | "none";
  /** Filled when the request was authenticated against the admins table. */
  admin?: Admin | null;
};

export async function checkAdmin(creds: AdminCreds): Promise<AdminAuthResult> {
  const env = getEnv();
  // Make sure the env-configured super admin exists; idempotent.
  try { await ensureSuperAdmin(); } catch {}

  // Path A: session token (from admin login form) — preferred.
  if (creds.sessionToken) {
    const a = await getAdminBySession(creds.sessionToken);
    if (a) {
      return {
        ok: true,
        isAdmin: true,
        user: null,
        via: "session",
        admin: a,
      };
    }
  }

  // Path B: legacy server-side password (browser fallback for env ADMIN_PASSWORD).
  const pass = env.ADMIN_PASSWORD ?? "";
  if (pass && creds.adminPass && creds.adminPass === pass) {
    return { ok: true, isAdmin: true, user: null, via: "password", admin: null };
  }

  // Path C: Telegram initData of any configured admin TG ID OR admins.tg_user_id.
  const botToken = env.BOT_TOKEN ?? "";
  if (botToken && creds.initData) {
    const user = await validateInitData(creds.initData, botToken);
    if (user) {
      // Tg ID in env list?
      if (isAdminId(user.id)) {
        return { ok: true, isAdmin: true, user, via: "telegram", admin: null };
      }
      // Tg ID linked to an admins row?
      const a = await findAdminByTgUserId(user.id);
      if (a) {
        return {
          ok: true,
          isAdmin: true,
          user,
          via: "telegram",
          admin: {
            id: a.id,
            login: a.login,
            role: a.role,
            masterId: a.master_id,
            tgUserId: a.tg_user_id,
            displayName: a.display_name,
            createdAt: a.created_at,
          },
        };
      }
      return { ok: true, isAdmin: false, user, via: "telegram", admin: null };
    }
  }

  return { ok: false, isAdmin: false, user: null, via: "none", admin: null };
}

/** Telegram-only auth (for bookings ops where the customer is the actor). */
export async function checkUser(
  initData: string,
): Promise<AdminAuthResult> {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  if (!botToken || !initData) {
    return { ok: false, isAdmin: false, user: null, via: "none" };
  }
  const user = await validateInitData(initData, botToken);
  if (!user) return { ok: false, isAdmin: false, user: null, via: "none" };
  return { ok: true, isAdmin: isAdminId(user.id), user, via: "telegram" };
}
