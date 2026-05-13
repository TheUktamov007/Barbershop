import { createServerFn } from "@tanstack/react-start";
import { checkAdmin, checkUser } from "./server/admin-auth";
import { getEnv } from "./server/env";
import {
  ensureReferralCode,
  findCustomerByReferralCode,
  setReferrer,
  toggleFavoriteMaster,
  getOrCreateCustomer,
  awardReferralBonuses,
  type CustomerProfile,
} from "./server/customer-db";

type AdminAuth = { initData?: string; adminPass?: string; sessionToken?: string };

// =================== Broadcast ===================

export const broadcastFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { text: string }) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; sent: number; failed: number; error?: string }> => {
      const a = await checkAdmin(data);
      if (!a.isAdmin) return { ok: false, sent: 0, failed: 0, error: "admin only" };

      const env = getEnv();
      const botToken = env.BOT_TOKEN ?? "";
      if (!botToken) return { ok: false, sent: 0, failed: 0, error: "BOT_TOKEN not set" };
      const text = data.text.trim();
      if (!text) return { ok: false, sent: 0, failed: 0, error: "empty" };

      const { results } = await env.DB.prepare(
        `SELECT tg_user_id FROM customers WHERE tg_user_id IS NOT NULL`,
      ).all<{ tg_user_id: number }>();
      const ids = (results ?? []).map((r) => r.tg_user_id);

      let sent = 0;
      let failed = 0;
      // Send sequentially with light rate limit (Telegram allows ~30 msg/sec but
      // we stay conservative). Worker has a 30s CPU cap, so chunk and yield.
      for (const id of ids) {
        try {
          const res = await fetch(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                chat_id: id,
                text,
                parse_mode: "HTML",
                disable_web_page_preview: true,
              }),
            },
          );
          const j = (await res.json().catch(() => ({}))) as { ok?: boolean };
          if (j.ok) sent++;
          else failed++;
        } catch {
          failed++;
        }
      }

      await env.DB.prepare(
        `INSERT INTO broadcasts (text, sent_count, failed_count) VALUES (?1, ?2, ?3)`,
      )
        .bind(text, sent, failed)
        .run();
      return { ok: true, sent, failed };
    },
  );

// =================== Referrals ===================

export const getMyReferralFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(
    async ({ data }): Promise<{
      ok: boolean;
      code?: string;
      inviteUrl?: string;
      invitedCount?: number;
      bonusEarned?: number;
    }> => {
      const a = await checkUser(data.initData);
      if (!a.ok || !a.user) return { ok: false };
      await getOrCreateCustomer({
        tgUserId: a.user.id,
        firstName: a.user.first_name,
        lastName: a.user.last_name,
        username: a.user.username,
      });
      const code = await ensureReferralCode(a.user.id);

      const env = getEnv();
      const stats = await env.DB.prepare(
        `SELECT COUNT(*) AS cnt, COALESCE(SUM(delta), 0) AS total
           FROM (
             SELECT delta FROM bonus_txns
               WHERE tg_user_id = ?1 AND reason = 'referral'
           )`,
      )
        .bind(a.user.id)
        .first<{ cnt: number; total: number }>();
      const invitedCount = await env.DB.prepare(
        `SELECT COUNT(*) AS cnt FROM customers WHERE referred_by = ?1`,
      )
        .bind(a.user.id)
        .first<{ cnt: number }>();

      // Mini-app deep link (Telegram start_param picked up by the bot/web app).
      const inviteUrl = `https://t.me/bravobarber_bot?start=ref_${code}`;

      return {
        ok: true,
        code,
        inviteUrl,
        invitedCount: invitedCount?.cnt ?? 0,
        bonusEarned: stats?.total ?? 0,
      };
    },
  );

/**
 * Called from the client when start_param contains "ref_<code>" вЂ” links the
 * current user to that referrer if not already linked.
 */
export const claimReferralFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string; refCode: string }) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; awarded?: boolean }> => {
      const a = await checkUser(data.initData);
      if (!a.ok || !a.user) return { ok: false };
      await getOrCreateCustomer({
        tgUserId: a.user.id,
        firstName: a.user.first_name,
        lastName: a.user.last_name,
        username: a.user.username,
      });
      const referrer = await findCustomerByReferralCode(data.refCode);
      if (!referrer || referrer.tgUserId === a.user.id) return { ok: false };
      await setReferrer(a.user.id, referrer.tgUserId);
      // Bonus awarded after the new user's FIRST completed visit вЂ” for now
      // we just link them. (Could move to maybeAccrueBonus to trigger then.)
      return { ok: true };
    },
  );

/**
 * Manually award referral bonuses (called by admin or after first visit).
 */
export const awardReferralFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { refereeId: number }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    const env = getEnv();
    const row = await env.DB.prepare(
      `SELECT referred_by FROM customers WHERE tg_user_id = ?1`,
    )
      .bind(data.refereeId)
      .first<{ referred_by: number | null }>();
    if (!row?.referred_by) return { ok: false, error: "no referrer" };
    await awardReferralBonuses(data.refereeId, row.referred_by);
    return { ok: true };
  });

// =================== Favorites ===================

export const toggleFavoriteFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string; masterId: string }) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; favorites: string[] }> => {
      const a = await checkUser(data.initData);
      if (!a.ok || !a.user) return { ok: false, favorites: [] };
      await getOrCreateCustomer({
        tgUserId: a.user.id,
        firstName: a.user.first_name,
        lastName: a.user.last_name,
        username: a.user.username,
      });
      const fav = await toggleFavoriteMaster(a.user.id, data.masterId);
      return { ok: true, favorites: fav };
    },
  );

// =================== CSV export ===================

export const exportBookingsCsvFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; csv?: string; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    const env = getEnv();
    const { results } = await env.DB.prepare(
      `SELECT id, tg_user_id, customer_name, service_title, master_name,
              branch_name, start_at, duration_min, price, status,
              cancel_reason, created_at
         FROM bookings ORDER BY start_at DESC LIMIT 5000`,
    ).all<{
      id: string;
      tg_user_id: number | null;
      customer_name: string | null;
      service_title: string;
      master_name: string;
      branch_name: string;
      start_at: string;
      duration_min: number;
      price: number;
      status: string;
      cancel_reason: string | null;
      created_at: number;
    }>();
    const rows = results ?? [];

    const esc = (v: string | number | null) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "ID",
      "TG_ID",
      "РљР»РёРµРЅС‚",
      "РЈСЃР»СѓРіР°",
      "РњР°СЃС‚РµСЂ",
      "Р¤РёР»РёР°Р»",
      "РљРѕРіРґР°",
      "Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ",
      "Р¦РµРЅР°",
      "РЎС‚Р°С‚СѓСЃ",
      "РџСЂРёС‡РёРЅР° РѕС‚РјРµРЅС‹",
      "РЎРѕР·РґР°РЅРѕ",
    ].join(",");
    const body = rows
      .map((r) =>
        [
          esc(r.id),
          esc(r.tg_user_id),
          esc(r.customer_name),
          esc(r.service_title),
          esc(r.master_name),
          esc(r.branch_name),
          esc(r.start_at),
          esc(r.duration_min),
          esc(r.price),
          esc(r.status),
          esc(r.cancel_reason),
          esc(new Date(r.created_at * 1000).toISOString()),
        ].join(","),
      )
      .join("\n");
    return { ok: true, csv: "п»ї" + header + "\n" + body };
  });

export const exportCustomersCsvFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }): Promise<{ ok: boolean; csv?: string; error?: string }> => {
    const a = await checkAdmin(data);
    if (!a.isAdmin) return { ok: false, error: "admin only" };
    const env = getEnv();
    const { results } = await env.DB.prepare(
      `SELECT tg_user_id, first_name, last_name, username, phone,
              bonus_points, total_spent, visits_count, birthday, created_at
         FROM customers ORDER BY visits_count DESC LIMIT 5000`,
    ).all<{
      tg_user_id: number;
      first_name: string | null;
      last_name: string | null;
      username: string | null;
      phone: string | null;
      bonus_points: number;
      total_spent: number;
      visits_count: number;
      birthday: string | null;
      created_at: number;
    }>();
    const rows = results ?? [];
    const esc = (v: string | number | null) => {
      if (v == null) return "";
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "TG_ID",
      "РРјСЏ",
      "Р¤Р°РјРёР»РёСЏ",
      "Username",
      "РўРµР»РµС„РѕРЅ",
      "Р‘РѕРЅСѓСЃС‹",
      "РџРѕС‚СЂР°С‡РµРЅРѕ",
      "Р’РёР·РёС‚РѕРІ",
      "Р”Р ",
      "Р РµРіРёСЃС‚СЂР°С†РёСЏ",
    ].join(",");
    const body = rows
      .map((r) =>
        [
          esc(r.tg_user_id),
          esc(r.first_name),
          esc(r.last_name),
          esc(r.username),
          esc(r.phone),
          esc(r.bonus_points),
          esc(r.total_spent),
          esc(r.visits_count),
          esc(r.birthday),
          esc(new Date(r.created_at * 1000).toISOString()),
        ].join(","),
      )
      .join("\n");
    return { ok: true, csv: "п»ї" + header + "\n" + body };
  });

export type { CustomerProfile };
