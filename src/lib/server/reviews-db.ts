import { getEnv } from "./env";

export type Review = {
  id: string;
  tgUserId: number;
  customerName?: string;
  bookingId: string;
  masterId?: string;
  serviceId?: string;
  rating: number;
  text?: string;
  status: "published" | "hidden";
  createdAt: number;
};

type DbReview = {
  id: string;
  tg_user_id: number;
  customer_name: string | null;
  booking_id: string;
  master_id: string | null;
  service_id: string | null;
  rating: number;
  text: string | null;
  status: "published" | "hidden";
  created_at: number;
};

const fromRow = (r: DbReview): Review => ({
  id: r.id,
  tgUserId: r.tg_user_id,
  customerName: r.customer_name ?? undefined,
  bookingId: r.booking_id,
  masterId: r.master_id ?? undefined,
  serviceId: r.service_id ?? undefined,
  rating: r.rating,
  text: r.text ?? undefined,
  status: r.status,
  createdAt: r.created_at,
});

function uid() {
  return "rv-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

export async function createReview(input: {
  tgUserId: number;
  customerName?: string;
  bookingId: string;
  masterId?: string;
  serviceId?: string;
  rating: number;
  text?: string;
}): Promise<{ ok: boolean; review?: Review; error?: string }> {
  const { DB } = getEnv();

  // Validate booking ownership + status.
  const b = await DB.prepare(
    `SELECT id, tg_user_id, status, master_id FROM bookings WHERE id = ?1`,
  )
    .bind(input.bookingId)
    .first<{ id: string; tg_user_id: number | null; status: string; master_id: string | null }>();
  if (!b) return { ok: false, error: "booking not found" };
  if (b.tg_user_id !== input.tgUserId) return { ok: false, error: "forbidden" };
  if (b.status !== "completed") return { ok: false, error: "Можно оставлять отзыв только после завершённого визита." };

  // Insert (unique by booking_id — second submit will fail).
  const id = uid();
  try {
    await DB.prepare(
      `INSERT INTO reviews (id, tg_user_id, customer_name, booking_id, master_id, service_id, rating, text)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
      .bind(
        id,
        input.tgUserId,
        input.customerName ?? null,
        input.bookingId,
        input.masterId ?? b.master_id ?? null,
        input.serviceId ?? null,
        Math.max(1, Math.min(5, Math.round(input.rating))),
        input.text?.slice(0, 1000) ?? null,
      )
      .run();
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    if (msg.toLowerCase().includes("unique")) {
      return { ok: false, error: "Отзыв на этот визит уже оставлен." };
    }
    throw e;
  }

  // Recompute master's aggregate rating (denormalized into masters.rating).
  if (b.master_id) {
    await recomputeMasterRating(b.master_id);
  }

  const row = await DB.prepare(`SELECT * FROM reviews WHERE id = ?1`)
    .bind(id)
    .first<DbReview>();
  return { ok: true, review: row ? fromRow(row) : undefined };
}

export async function recomputeMasterRating(masterId: string): Promise<void> {
  const { DB } = getEnv();
  const agg = await DB.prepare(
    `SELECT AVG(CAST(rating AS REAL)) AS avg_rating, COUNT(*) AS cnt
       FROM reviews WHERE master_id = ?1 AND status = 'published'`,
  )
    .bind(masterId)
    .first<{ avg_rating: number | null; cnt: number }>();
  if (!agg || agg.cnt === 0) return;
  // Blend with the master's seed rating when there are few reviews
  // (so 1 bad review doesn't tank a new master).
  const blended =
    agg.cnt >= 5
      ? agg.avg_rating!
      : (agg.avg_rating! * agg.cnt + 5.0 * (5 - agg.cnt)) / 5;
  const rounded = Math.round(blended * 10) / 10;
  await DB.prepare(
    `UPDATE masters SET rating = ?1, updated_at = unixepoch() WHERE id = ?2`,
  )
    .bind(rounded, masterId)
    .run();
}

export async function listReviewsForMaster(
  masterId: string,
  limit = 10,
): Promise<Review[]> {
  const { DB } = getEnv();
  const res = await DB.prepare(
    `SELECT * FROM reviews
       WHERE master_id = ?1 AND status = 'published'
       ORDER BY created_at DESC LIMIT ?2`,
  )
    .bind(masterId, limit)
    .all<DbReview>();
  return (res.results ?? []).map(fromRow);
}

export async function getReviewForBooking(
  bookingId: string,
): Promise<Review | null> {
  const { DB } = getEnv();
  const row = await DB.prepare(`SELECT * FROM reviews WHERE booking_id = ?1`)
    .bind(bookingId)
    .first<DbReview>();
  return row ? fromRow(row) : null;
}
