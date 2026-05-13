// Client-side slot availability + slot-lock simulation.
// Two clients (tabs) can't book the same time: locks are persisted to
// localStorage, broadcast across tabs, and expire after LOCK_TTL.

import { masters } from "./mock";

export const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "lume:slots:v1";
const CHANNEL = "lume:slots";

export type SlotStatus = "free" | "locked" | "mine" | "booked" | "past" | "closed";

export interface SlotInfo {
  time: string;
  status: SlotStatus;
  /** ms until the lock expires (only when mine/locked) */
  msLeft?: number;
}

interface Lock {
  sessionId: string;
  expiresAt: number;
}

interface Store {
  locks: Record<string, Lock>;
  bookings: Record<string, true>;
}

// ---------- session id (per browser tab) ----------
const sessionId =
  typeof window === "undefined"
    ? "ssr"
    : (() => {
        const k = "lume:sid";
        let v = sessionStorage.getItem(k);
        if (!v) {
          v = Math.random().toString(36).slice(2) + Date.now().toString(36);
          sessionStorage.setItem(k, v);
        }
        return v;
      })();

export const mySessionId = sessionId;

// ---------- storage ----------
function load(): Store {
  if (typeof window === "undefined") return { locks: {}, bookings: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { locks: {}, bookings: {} };
    const parsed = JSON.parse(raw) as Store;
    return {
      locks: parsed.locks ?? {},
      bookings: parsed.bookings ?? {},
    };
  } catch {
    return { locks: {}, bookings: {} };
  }
}

function save(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  channel?.postMessage({ t: Date.now() });
}

const channel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel(CHANNEL)
    : null;

// ---------- subscription ----------
type Listener = () => void;
const listeners = new Set<Listener>();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((l) => l());
  });
  channel?.addEventListener("message", () => listeners.forEach((l) => l()));
  // tick every 15s to refresh countdowns / expirations
  setInterval(() => listeners.forEach((l) => l()), 15000);
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

// ---------- keys ----------
export function slotKey(
  branchId: string,
  masterId: string,
  date: string,
  time: string
) {
  return `${branchId}|${masterId}|${date}|${time}`;
}

// "Any master" — try to find a real master that's free, return that key.
// Returns null when no candidate is available.
function resolveMasterIds(
  branchId: string,
  masterId: string,
  serviceId?: string
): string[] {
  if (masterId !== "any") return [masterId];
  return masters
    .filter(
      (m) =>
        m.branchIds.includes(branchId) &&
        (!serviceId || m.serviceIds.includes(serviceId))
    )
    .map((m) => m.id);
}

// ---------- deterministic "natural" busy slots ----------
// Mock master schedule: each master has a few pseudo-busy slots per day.
function isMasterBusy(masterId: string, date: string, time: string) {
  let h = 0;
  const s = `${masterId}|${date}|${time}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 5 === 0; // ~20% pre-booked
}

// ---------- public API ----------
export function generateTimes(): string[] {
  const out: string[] = [];
  for (let h = 10; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
}

export function getSlots(
  branchId: string,
  masterId: string,
  date: string,
  serviceId?: string
): SlotInfo[] {
  const store = load();
  const now = Date.now();
  const candidateMasters = resolveMasterIds(branchId, masterId, serviceId);
  const isToday = new Date(date).toDateString() === new Date().toDateString();

  return generateTimes().map((time) => {
    if (isToday) {
      const [hh, mm] = time.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(hh, mm, 0, 0);
      if (slotTime.getTime() < now) return { time, status: "past" as const };
    }

    // Aggregate across candidate masters: slot is free if ANY candidate is free.
    let bestStatus: SlotStatus = "booked";
    let mineMsLeft: number | undefined;
    let lockedMsLeft: number | undefined;

    for (const mid of candidateMasters) {
      const k = slotKey(branchId, mid, date, time);
      if (store.bookings[k]) continue;
      if (isMasterBusy(mid, date, time)) continue;

      const lock = store.locks[k];
      if (lock && lock.expiresAt > now) {
        if (lock.sessionId === sessionId) {
          mineMsLeft = lock.expiresAt - now;
        } else {
          lockedMsLeft = lock.expiresAt - now;
        }
        continue;
      }
      bestStatus = "free";
      break;
    }

    if (bestStatus === "free") return { time, status: "free" };
    if (mineMsLeft !== undefined)
      return { time, status: "mine", msLeft: mineMsLeft };
    if (lockedMsLeft !== undefined)
      return { time, status: "locked", msLeft: lockedMsLeft };
    return { time, status: "booked" };
  });
}

/**
 * Try to lock a slot for this session. Returns the resolved masterId on success
 * (useful when masterId === 'any'), or null on failure.
 * Also releases any previous lock owned by this session for this booking flow.
 */
export function acquireLock(
  branchId: string,
  masterId: string,
  date: string,
  time: string,
  serviceId: string | undefined,
  prevKey?: string
): { ok: true; key: string; resolvedMasterId: string } | { ok: false; reason: SlotStatus } {
  const store = load();
  const now = Date.now();

  // release previous
  if (prevKey && store.locks[prevKey]?.sessionId === sessionId) {
    delete store.locks[prevKey];
  }

  const candidates = resolveMasterIds(branchId, masterId, serviceId);
  for (const mid of candidates) {
    const k = slotKey(branchId, mid, date, time);
    if (store.bookings[k]) continue;
    if (isMasterBusy(mid, date, time)) continue;
    const lock = store.locks[k];
    if (lock && lock.expiresAt > now && lock.sessionId !== sessionId) continue;

    store.locks[k] = { sessionId, expiresAt: now + LOCK_TTL_MS };
    save(store);
    return { ok: true, key: k, resolvedMasterId: mid };
  }
  return { ok: false, reason: "locked" };
}

export function releaseLock(key: string) {
  const store = load();
  if (store.locks[key]?.sessionId === sessionId) {
    delete store.locks[key];
    save(store);
  }
}

export function refreshLock(key: string): boolean {
  const store = load();
  const lock = store.locks[key];
  if (!lock || lock.sessionId !== sessionId) return false;
  lock.expiresAt = Date.now() + LOCK_TTL_MS;
  save(store);
  return true;
}

export function holdsLock(key: string): boolean {
  const store = load();
  const lock = store.locks[key];
  return !!lock && lock.sessionId === sessionId && lock.expiresAt > Date.now();
}

export function confirmBooking(key: string): boolean {
  const store = load();
  const lock = store.locks[key];
  if (!lock || lock.sessionId !== sessionId || lock.expiresAt <= Date.now()) {
    return false;
  }
  store.bookings[key] = true;
  delete store.locks[key];
  save(store);
  return true;
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
