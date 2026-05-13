import { createServerFn } from "@tanstack/react-start";
import { checkAdmin } from "./server/admin-auth";
import { getEnv } from "./server/env";
import { recomputeMasterRating } from "./server/reviews-db";
import type { Review } from "./server/reviews-db";

type AdminAuth = { initData?: string; adminPass?: string };

// =================== Review moderation ===================

type DbReviewFull = {
  id: string;
  tg_user_id: number;
  customer_name: string | null;
  booking_id: string;
  master_id: string | null;
  service_id: string | null;
  rating: number;
  text: string | null;
  status: "published" | "hidden";
  admin_reply: string | null;
  replied_at: number | null;
  created_at: number;
};

function reviewFromRow(r: DbReviewFull): Review & {
  adminReply?: string;
  repliedAt?: number;
} {
  return {
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
    adminReply: r.admin_reply ?? undefined,
    repliedAt: r.replied_at ?? undefined,
  };
}

export const listAllReviewsFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }) => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return [];
    const env = getEnv();
    const { results } = await env.DB.prepare(
      `SELECT * FROM reviews ORDER BY created_at DESC LIMIT 500`,
    ).all<DbReviewFull>();
    return (results ?? []).map(reviewFromRow);
  });

export const moderateReviewFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: AdminAuth & { id: string; status: "published" | "hidden" }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    const env = getEnv();
    const row = await env.DB.prepare(
      `SELECT master_id FROM reviews WHERE id = ?1`,
    )
      .bind(data.id)
      .first<{ master_id: string | null }>();
    await env.DB.prepare(
      `UPDATE reviews SET status = ?1 WHERE id = ?2`,
    )
      .bind(data.status, data.id)
      .run();
    if (row?.master_id) {
      await recomputeMasterRating(row.master_id);
    }
    return { ok: true };
  });

export const replyToReviewFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { id: string; reply: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    const env = getEnv();
    const reply = data.reply.trim().slice(0, 1000);
    await env.DB.prepare(
      `UPDATE reviews SET admin_reply = ?1, replied_at = unixepoch() WHERE id = ?2`,
    )
      .bind(reply || null, data.id)
      .run();
    return { ok: true };
  });

// =================== Master earnings / commission ===================

export type MasterEarnings = {
  masterId: string;
  name: string;
  visits: number;
  revenue: number;
  commissionPct: number;
  commissionAmount: number;
};

export const masterEarningsFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { period: "7d" | "30d" | "ytd" | "all" }) => data)
  .handler(async ({ data }): Promise<MasterEarnings[]> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return [];
    const env = getEnv();
    const now = new Date();
    let from: string | null = null;
    if (data.period === "7d") {
      from = new Date(now.getTime() - 7 * 86400_000).toISOString().slice(0, 19);
    } else if (data.period === "30d") {
      from = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 19);
    } else if (data.period === "ytd") {
      from = `${now.getFullYear()}-01-01T00:00:00`;
    }

    const sql = from
      ? `SELECT b.master_id, b.master_name, m.commission_pct,
                COUNT(*) AS visits, SUM(b.price) AS revenue
           FROM bookings b
           LEFT JOIN masters m ON m.id = b.master_id
           WHERE b.status = 'completed' AND b.start_at >= ?1
           GROUP BY b.master_id, b.master_name, m.commission_pct
           ORDER BY revenue DESC`
      : `SELECT b.master_id, b.master_name, m.commission_pct,
                COUNT(*) AS visits, SUM(b.price) AS revenue
           FROM bookings b
           LEFT JOIN masters m ON m.id = b.master_id
           WHERE b.status = 'completed'
           GROUP BY b.master_id, b.master_name, m.commission_pct
           ORDER BY revenue DESC`;
    const stmt = from ? env.DB.prepare(sql).bind(from) : env.DB.prepare(sql);
    const { results } = await stmt.all<{
      master_id: string | null;
      master_name: string;
      commission_pct: number | null;
      visits: number;
      revenue: number;
    }>();
    return (results ?? []).map((r) => {
      const pct = r.commission_pct ?? 40;
      const revenue = r.revenue ?? 0;
      return {
        masterId: r.master_id ?? "",
        name: r.master_name,
        visits: r.visits,
        revenue,
        commissionPct: pct,
        commissionAmount: Math.floor((revenue * pct) / 100),
      };
    });
  });
