import { getTelegramWebApp } from "./telegram-client";
import { getAdminToken } from "./admin-session";

const PASS_KEY = "lume_admin_pass_v1";

/**
 * The actual password the user typed on the AccessDenied screen.
 * Persisted in localStorage so they don't re-enter on every reload.
 * Sent as `adminPass` to server functions; server validates against the
 * ADMIN_PASSWORD secret (env var).
 */
export function getAdminPass(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(PASS_KEY) ?? undefined;
}

export function setAdminPass(value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PASS_KEY, value);
}

export function clearAdminPass(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PASS_KEY);
}

/** Build auth payload for admin server fns. Includes all creds — server picks valid one. */
export function adminAuthPayload(): {
  initData?: string;
  adminPass?: string;
  sessionToken?: string;
} {
  return {
    initData: getTelegramWebApp()?.initData ?? "",
    adminPass: getAdminPass(),
    sessionToken: getAdminToken() || undefined,
  };
}
