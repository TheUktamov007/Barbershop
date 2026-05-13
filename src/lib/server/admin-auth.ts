import { validateInitData } from "../telegram-server";
import { getEnv } from "./env";

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
  via: "telegram" | "password" | "none";
};

export async function checkAdmin(creds: AdminCreds): Promise<AdminAuthResult> {
  const env = getEnv();

  // Path A: server-side password (browser fallback).
  const pass = env.ADMIN_PASSWORD ?? "";
  if (pass && creds.adminPass && creds.adminPass === pass) {
    return { ok: true, isAdmin: true, user: null, via: "password" };
  }

  // Path B: Telegram initData of any configured admin.
  const botToken = env.BOT_TOKEN ?? "";
  if (botToken && creds.initData) {
    const user = await validateInitData(creds.initData, botToken);
    if (user) {
      return { ok: true, isAdmin: isAdminId(user.id), user, via: "telegram" };
    }
  }

  return { ok: false, isAdmin: false, user: null, via: "none" };
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
