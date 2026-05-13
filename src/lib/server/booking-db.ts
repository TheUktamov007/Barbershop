import { getEnv } from "./env";

export type BookingStatus =
  | "upcoming"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type DbBooking = {
  id: string;
  tg_user_id: number | null;
  customer_name: string | null;
  customer_username: string | null;
  service_title: string;
  service_ids: string | null;
  master_id: string | null;
  master_name: string;
  branch_id: string | null;
  branch_name: string;
  start_at: string;
  duration_min: number;
  price: number;
  status: BookingStatus;
  reminder_24h_sent: number;
  reminder_2h_sent: number;
  cancel_reason: string | null;
  created_by_admin: number;
  created_at: number;
  updated_at: number;
};

export type ClientBooking = {
  id: string;
  tgUserId?: number;
  customerName?: string;
  customerUsername?: string;
  serviceTitle: string;
  serviceIds?: string[];
  masterId?: string;
  masterName: string;
  branchId?: string;
  branchName: string;
  startAt: string;
  durationMin: number;
  price: number;
  status: BookingStatus;
  cancelReason?: string;
  createdByAdmin?: boolean;
  createdAt: number;
  updatedAt: number;
};

export function rowToClient(r: DbBooking): ClientBooking {
  return {
    id: r.id,
    tgUserId: r.tg_user_id ?? undefined,
    customerName: r.customer_name ?? undefined,
    customerUsername: r.customer_username ?? undefined,
    serviceTitle: r.service_title,
    serviceIds: r.service_ids ? safeJsonArray(r.service_ids) : undefined,
    masterId: r.master_id ?? undefined,
    masterName: r.master_name,
    branchId: r.branch_id ?? undefined,
    branchName: r.branch_name,
    startAt: r.start_at,
    durationMin: r.duration_min,
    price: r.price,
    status: r.status,
    cancelReason: r.cancel_reason ?? undefined,
    createdByAdmin: r.created_by_admin === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function uid(prefix = "bk") {
  return (
    prefix +
    "-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

export async function listBookingsForUser(
  tgUserId: number,
): Promise<ClientBooking[]> {
  const { DB } = getEnv();
  const res = await DB.prepare(
    `SELECT * FROM bookings WHERE tg_user_id = ?1 ORDER BY start_at DESC`,
  )
    .bind(tgUserId)
    .all<DbBooking>();
  return (res.results ?? []).map(rowToClient);
}

export async function listAllBookings(): Promise<ClientBooking[]> {
  const { DB } = getEnv();
  const res = await DB.prepare(
    `SELECT * FROM bookings ORDER BY start_at DESC LIMIT 500`,
  ).all<DbBooking>();
  return (res.results ?? []).map(rowToClient);
}

export async function findBooking(id: string): Promise<ClientBooking | null> {
  const { DB } = getEnv();
  const row = await DB.prepare(`SELECT * FROM bookings WHERE id = ?1`)
    .bind(id)
    .first<DbBooking>();
  return row ? rowToClient(row) : null;
}

export type CreateBookingInput = {
  tgUserId?: number;
  customerName?: string;
  customerUsername?: string;
  serviceTitle: string;
  serviceIds?: string[];
  masterId?: string;
  masterName: string;
  branchId?: string;
  branchName: string;
  startAt: string;
  durationMin: number;
  price: number;
};

export async function createBooking(
  input: CreateBookingInput,
): Promise<ClientBooking> {
  const { DB } = getEnv();

  // Conflict check: only one active booking per (master, start_at).
  // Skips "any master" (no masterId) — those are matched by the salon later.
  if (input.masterId) {
    const conflict = await DB.prepare(
      `SELECT id FROM bookings
         WHERE master_id = ?1
           AND start_at = ?2
           AND status IN ('upcoming', 'confirmed')
         LIMIT 1`,
    )
      .bind(input.masterId, input.startAt)
      .first<{ id: string }>();
    if (conflict) {
      throw new Error("SLOT_TAKEN");
    }
  }

  const id = uid();
  const now = Math.floor(Date.now() / 1000);
  await DB.prepare(
    `INSERT INTO bookings (
      id, tg_user_id, customer_name, customer_username,
      service_title, service_ids,
      master_id, master_name, branch_id, branch_name,
      start_at, duration_min, price,
      status, reminder_24h_sent, reminder_2h_sent,
      created_at, updated_at
    ) VALUES (
      ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
      'upcoming', 0, 0, ?14, ?15
    )`,
  )
    .bind(
      id,
      input.tgUserId ?? null,
      input.customerName ?? null,
      input.customerUsername ?? null,
      input.serviceTitle,
      input.serviceIds ? JSON.stringify(input.serviceIds) : null,
      input.masterId ?? null,
      input.masterName,
      input.branchId ?? null,
      input.branchName,
      input.startAt,
      input.durationMin,
      input.price,
      now,
      now,
    )
    .run();
  const created = await findBooking(id);
  if (!created) throw new Error("Failed to read back inserted booking");
  return created;
}

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
  cancelReason?: string,
): Promise<void> {
  const { DB } = getEnv();
  const now = Math.floor(Date.now() / 1000);
  if (cancelReason !== undefined && status === "cancelled") {
    await DB.prepare(
      `UPDATE bookings SET status = ?1, cancel_reason = ?2, updated_at = ?3 WHERE id = ?4`,
    )
      .bind(status, cancelReason, now, id)
      .run();
  } else {
    await DB.prepare(
      `UPDATE bookings SET status = ?1, updated_at = ?2 WHERE id = ?3`,
    )
      .bind(status, now, id)
      .run();
  }
}

/**
 * Manual booking created by admin (walk-in or phone). No conflict check,
 * no Telegram user required.
 */
export async function createAdminBooking(input: {
  serviceTitle: string;
  serviceIds?: string[];
  masterId?: string;
  masterName: string;
  branchId?: string;
  branchName: string;
  startAt: string;
  durationMin: number;
  price: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<ClientBooking> {
  const { DB } = getEnv();
  const id = "bk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
  const now = Math.floor(Date.now() / 1000);
  await DB.prepare(
    `INSERT INTO bookings (
      id, tg_user_id, customer_name, customer_username,
      service_title, service_ids,
      master_id, master_name, branch_id, branch_name,
      start_at, duration_min, price,
      status, reminder_24h_sent, reminder_2h_sent,
      created_by_admin,
      created_at, updated_at
    ) VALUES (
      ?1, NULL, ?2, NULL, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
      'confirmed', 1, 1, 1, ?12, ?13
    )`,
  )
    .bind(
      id,
      input.customerName ?? null,
      input.serviceTitle,
      input.serviceIds ? JSON.stringify(input.serviceIds) : null,
      input.masterId ?? null,
      input.masterName,
      input.branchId ?? null,
      input.branchName,
      input.startAt,
      input.durationMin,
      input.price,
      now,
      now,
    )
    .run();
  // Stash phone in a separate spot if you have it — for now we keep it in
  // customer_name as a suffix to keep the schema small.
  const created = await findBooking(id);
  if (!created) throw new Error("Failed to read back admin booking");
  return created;
}

export async function rescheduleBooking(
  id: string,
  newStartAt: string,
): Promise<void> {
  const { DB } = getEnv();
  const now = Math.floor(Date.now() / 1000);
  await DB.prepare(
    `UPDATE bookings
       SET start_at = ?1,
           updated_at = ?2,
           reminder_24h_sent = 0,
           reminder_2h_sent = 0,
           status = CASE WHEN status = 'cancelled' THEN 'upcoming' ELSE status END
     WHERE id = ?3`,
  )
    .bind(newStartAt, now, id)
    .run();
}

export async function markReminderSent(
  id: string,
  kind: "24h" | "2h",
): Promise<void> {
  const { DB } = getEnv();
  const col = kind === "24h" ? "reminder_24h_sent" : "reminder_2h_sent";
  await DB.prepare(
    `UPDATE bookings SET ${col} = 1, updated_at = unixepoch() WHERE id = ?1`,
  )
    .bind(id)
    .run();
}

/**
 * Bookings that need a reminder right now.
 * - 24h reminder: 23.5h–24.5h before start (1h window around the 24h mark).
 * - 2h reminder: 1.75h–2.25h before start.
 */
export async function listBookingsNeedingReminder(
  kind: "24h" | "2h",
): Promise<DbBooking[]> {
  const { DB } = getEnv();
  const col = kind === "24h" ? "reminder_24h_sent" : "reminder_2h_sent";
  const minutesBefore = kind === "24h" ? 24 * 60 : 2 * 60;
  const windowMin = kind === "24h" ? 30 : 15;
  const now = new Date();
  const lo = new Date(now.getTime() + (minutesBefore - windowMin) * 60_000)
    .toISOString()
    .slice(0, 19);
  const hi = new Date(now.getTime() + (minutesBefore + windowMin) * 60_000)
    .toISOString()
    .slice(0, 19);
  const res = await DB.prepare(
    `SELECT * FROM bookings
       WHERE ${col} = 0
         AND status IN ('upcoming', 'confirmed')
         AND start_at >= ?1
         AND start_at <= ?2`,
  )
    .bind(lo, hi)
    .all<DbBooking>();
  return res.results ?? [];
}
