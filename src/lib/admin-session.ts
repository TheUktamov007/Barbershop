// Tiny localStorage wrapper for the admin session token + cached admin profile.

import type { Admin } from "./server/admin-db";

const TOKEN_KEY = "bravo_admin_token_v1";
const ADMIN_KEY = "bravo_admin_profile_v1";

export function getAdminToken(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setAdminToken(token: string) {
  if (typeof localStorage === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getCachedAdmin(): Admin | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Admin;
  } catch {
    return null;
  }
}

export function setCachedAdmin(a: Admin | null) {
  if (typeof localStorage === "undefined") return;
  if (a) localStorage.setItem(ADMIN_KEY, JSON.stringify(a));
  else localStorage.removeItem(ADMIN_KEY);
}

export function clearAdminSession() {
  setAdminToken("");
  setCachedAdmin(null);
}
