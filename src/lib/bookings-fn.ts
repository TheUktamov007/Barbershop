import { createServerFn } from "@tanstack/react-start";
import { validateInitData } from "./telegram-server";
import { checkAdmin, checkUser } from "./server/admin-auth";
import {
  createBooking,
  listAllBookings,
  listBookingsForUser,
  findBooking,
  setBookingStatus,
  rescheduleBooking,
  type BookingStatus,
  type ClientBooking,
} from "./server/booking-db";
import { getEnv } from "./server/env";
import { findMasterAdminForMasterId } from "./server/admin-db";
import { maybeAccrueBonus, getOrCreateCustomer, spendBonusForBooking, getCustomer } from "./server/customer-db";
import { spendCertificate, usePackageVisit, findCertByCode } from "./server/cert-pkg-db";
import { pushToUser } from "./server/webpush";

async function authenticate(initData: string) {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  if (!botToken) return { ok: false as const, user: null, isAdmin: false };
  const user = await validateInitData(initData ?? "", botToken);
  if (!user) return { ok: false as const, user: null, isAdmin: false };
  const adminId = env.ADMIN_TELEGRAM_ID ?? "";
  return {
    ok: true as const,
    user,
    isAdmin: adminId !== "" && String(user.id) === String(adminId),
  };
}

async function tgDM(chatId: number | string, text: string) {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  if (!botToken) return false;
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    return !!data.ok;
  } catch {
    return false;
  }
}

/** Returns bookings for the authenticated user; for admin returns all. */
export const listBookingsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { initData: string }) => data)
  .handler(async ({ data }): Promise<ClientBooking[]> => {
    const auth = await authenticate(data.initData);
    if (!auth.ok || !auth.user) return [];
    if (auth.isAdmin) return await listAllBookings();
    return await listBookingsForUser(auth.user.id);
  });

/** Admin-only: returns ALL bookings. Master-role admins only see their own. */
export const listAllBookingsFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { initData?: string; adminPass?: string; sessionToken?: string }) =>
      data,
  )
  .handler(async ({ data }): Promise<ClientBooking[]> => {
    const auth = await checkAdmin({
      initData: data.initData,
      adminPass: data.adminPass,
      sessionToken: data.sessionToken,
    });
    if (!auth.isAdmin) return [];
    const all = await listAllBookings();
    // Master-role admins see only bookings assigned to their master_id.
    if (auth.admin && auth.admin.role === "master" && auth.admin.masterId) {
      return all.filter((b) => b.masterId === auth.admin!.masterId);
    }
    return all;
  });

export type CreateBookingFnInput = {
  initData: string;
  serviceTitle: string;
  serviceIds?: string[];
  masterId?: string;
  masterName: string;
  branchId?: string;
  branchName: string;
  startAt: string;
  durationMin: number;
  price: number;
  useBonus?: number;
  certCode?: string;
  packageId?: string;
  /** Promo id from a deep link. Server validates and applies discount. */
  promoId?: string;
};

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((data: CreateBookingFnInput) => data)
  .handler(
    async ({ data }): Promise<{ ok: boolean; booking?: ClientBooking; error?: string }> => {
      const auth = await authenticate(data.initData);
      if (!auth.ok || !auth.user) {
        return { ok: false, error: "not authenticated" };
      }

      const customerName =
        [auth.user.first_name, auth.user.last_name].filter(Boolean).join(" ") ||
        auth.user.username ||
        undefined;

      // Auto-create customer record (so the loyalty card works even if user
      // never opens profile).
      try {
        await getOrCreateCustomer({
          tgUserId: auth.user.id,
          firstName: auth.user.first_name,
          lastName: auth.user.last_name,
          username: auth.user.username,
        });
      } catch {}

      // Validate promo server-side: must exist, be active, and match the
      // selected services (or apply to all). Compute discount in sum.
      let promoDiscount = 0;
      let promoIdToStore: string | null = null;
      if (data.promoId) {
        const env = getEnv();
        const row = await env.DB.prepare(
          `SELECT id, discount_pct, service_ids, active FROM promos WHERE id = ?1`,
        )
          .bind(data.promoId)
          .first<{
            id: string;
            discount_pct: number;
            service_ids: string;
            active: number;
          }>();
        if (row && row.active === 1 && (row.discount_pct ?? 0) > 0) {
          let promoSvcIds: string[] = [];
          try {
            const v = JSON.parse(row.service_ids ?? "[]");
            if (Array.isArray(v)) promoSvcIds = v.map(String);
          } catch {}
          const applies =
            promoSvcIds.length === 0 ||
            (data.serviceIds ?? []).some((id) => promoSvcIds.includes(id));
          if (applies) {
            promoDiscount = Math.floor(
              (data.price * (row.discount_pct ?? 0)) / 100,
            );
            promoIdToStore = row.id;
          }
        }
      }
      const effectivePrice = Math.max(0, data.price - promoDiscount);

      let booking;
      try {
        booking = await createBooking({
          tgUserId: auth.user.id,
          customerName,
          customerUsername: auth.user.username,
          serviceTitle: data.serviceTitle,
          serviceIds: data.serviceIds,
          masterId: data.masterId,
          masterName: data.masterName,
          branchId: data.branchId,
          branchName: data.branchName,
          startAt: data.startAt,
          durationMin: data.durationMin,
          price: effectivePrice,
        });
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        if (msg === "SLOT_TAKEN") {
          return { ok: false, error: "Этот слот только что заняли. Выберите другое время." };
        }
        throw e;
      }

      // Persist promo discount on booking.
      if (promoIdToStore) {
        const env = getEnv();
        await env.DB.prepare(
          `UPDATE bookings SET promo_id = ?1, promo_discount = ?2 WHERE id = ?3`,
        )
          .bind(promoIdToStore, promoDiscount, booking.id)
          .run();
        booking = { ...booking, price: effectivePrice };
      }

      // Apply bonus points if requested (against the post-promo price).
      let bonusUsed = 0;
      if (data.useBonus && data.useBonus > 0) {
        bonusUsed = await spendBonusForBooking(
          auth.user.id,
          booking.id,
          data.useBonus,
          effectivePrice,
        );
      }

      // Apply gift certificate.
      let certUsed = 0;
      if (data.certCode) {
        const cert = await findCertByCode(data.certCode);
        if (cert && cert.status === "active") {
          const remainder = data.price - bonusUsed;
          certUsed = await spendCertificate(cert.id, booking.id, remainder);
        }
      }

      // Apply package (one visit deducted, price → 0 if pkg covers full service).
      let packageApplied = false;
      if (data.packageId) {
        packageApplied = await usePackageVisit(data.packageId, booking.id);
      }

      // Notify admin + user
      const env = getEnv();
      const adminId = env.ADMIN_TELEGRAM_ID ?? "";
      const dateLabel = new Date(booking.startAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      const netPrice = packageApplied ? 0 : Math.max(0, booking.price - bonusUsed - certUsed);
      const customer = await getCustomer(auth.user.id).catch(() => null);
      const phoneLine = customer?.phone ? `\n<b>Телефон:</b> ${customer.phone}` : "";
      const adminText =
        `<b>🆕 Новая запись Bravo</b>\n\n` +
        `<b>Клиент:</b> ${customerName ?? "—"}` +
        (auth.user.username ? ` (@${auth.user.username})` : "") +
        ` · ID ${auth.user.id}` +
        phoneLine +
        `\n<b>Когда:</b> ${dateLabel}\n` +
        `<b>Филиал:</b> ${booking.branchName}\n` +
        `<b>Мастер:</b> ${booking.masterName}\n\n` +
        `<b>Услуга:</b> ${booking.serviceTitle}\n` +
        `<b>Длительность:</b> ${booking.durationMin} мин\n` +
        `<b>Сумма:</b> ${data.price.toLocaleString("ru-RU")} сум` +
        (promoDiscount > 0 ? `\n<b>Акция:</b> −${promoDiscount.toLocaleString("ru-RU")}` : "") +
        (bonusUsed > 0 ? `\n<b>Бонусами:</b> −${bonusUsed.toLocaleString("ru-RU")}` : "") +
        (certUsed > 0 ? `\n<b>Ваучером:</b> −${certUsed.toLocaleString("ru-RU")}` : "") +
        (packageApplied ? `\n<b>По абонементу</b> ✓` : "") +
        (promoDiscount > 0 || bonusUsed > 0 || certUsed > 0 || packageApplied
          ? `\n<b>К оплате:</b> ${netPrice.toLocaleString("ru-RU")} сум`
          : "");
      const userText =
        `<b>✂️ Запись в Bravo подтверждена</b>\n\n` +
        `${booking.serviceTitle}\n${dateLabel}\n${booking.branchName}\n${booking.masterName}\n\n` +
        `<b>Итого:</b> ${booking.price.toLocaleString("ru-RU")} сум · ${booking.durationMin} мин\n\n` +
        `Оплата в барбершопе. Отмена бесплатна за 24 часа.\n` +
        `Напомним за 24ч и за 2ч.`;

      if (adminId) await tgDM(adminId, adminText);
      if (auth.user.id && String(auth.user.id) !== String(adminId)) {
        await tgDM(auth.user.id, userText);
      }
      // Notify the assigned master (if linked to an admins row with tg_user_id).
      if (data.masterId) {
        try {
          const masterAdmin = await findMasterAdminForMasterId(data.masterId);
          if (
            masterAdmin?.tg_user_id &&
            String(masterAdmin.tg_user_id) !== String(adminId) &&
            String(masterAdmin.tg_user_id) !== String(auth.user.id)
          ) {
            await tgDM(masterAdmin.tg_user_id, adminText);
          }
        } catch (e) {
          console.warn("[booking] notify master failed", e);
        }
      }

      // Web Push to the customer (in addition to TG). Best-effort.
      pushToUser(auth.user.id).catch(() => {});
      if (adminId && !isNaN(Number(adminId))) {
        pushToUser(Number(adminId)).catch(() => {});
      }

      return { ok: true, booking };
    },
  );

export const cancelBookingFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      initData?: string;
      adminPass?: string;
      sessionToken?: string;
      id: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkAdmin({
      initData: data.initData,
      adminPass: data.adminPass,
      sessionToken: data.sessionToken,
    });
    if (!auth.ok) return { ok: false, error: "not authenticated" };

    const b = await findBooking(data.id);
    if (!b) return { ok: false, error: "booking not found" };
    if (!auth.isAdmin && (!auth.user || b.tgUserId !== auth.user.id)) {
      return { ok: false, error: "forbidden" };
    }
    // Master role can only cancel bookings assigned to them.
    if (
      auth.admin &&
      auth.admin.role === "master" &&
      auth.admin.masterId &&
      b.masterId !== auth.admin.masterId
    ) {
      return { ok: false, error: "Чужая запись" };
    }
    await setBookingStatus(data.id, "cancelled");

    // Notify the other side.
    const env = getEnv();
    const adminId = env.ADMIN_TELEGRAM_ID ?? "";
    const dateLabel = new Date(b.startAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    if (auth.isAdmin) {
      if (b.tgUserId && String(b.tgUserId) !== String(adminId)) {
        await tgDM(
          b.tgUserId,
          `<b>❌ Ваша запись в Bravo отменена администратором</b>\n\n${b.serviceTitle}\n${dateLabel}\n${b.branchName}\n\nСвяжитесь с барбершопом для деталей.`,
        );
      }
    } else {
      if (adminId) {
        await tgDM(
          adminId,
          `<b>❌ Клиент отменил запись</b>\n\n${b.customerName ?? "—"} (ID ${b.tgUserId ?? "?"})\n${b.serviceTitle}\n${dateLabel}\n${b.branchName}`,
        );
      }
    }
    return { ok: true };
  });

export const setBookingStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      initData?: string;
      adminPass?: string;
      sessionToken?: string;
      id: string;
      status: BookingStatus;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await checkAdmin({
      initData: data.initData,
      adminPass: data.adminPass,
      sessionToken: data.sessionToken,
    });
    if (!auth.isAdmin) return { ok: false, error: "admin only" };

    const b = await findBooking(data.id);
    if (!b) return { ok: false, error: "booking not found" };

    // Master role: only their bookings.
    if (
      auth.admin &&
      auth.admin.role === "master" &&
      auth.admin.masterId &&
      b.masterId !== auth.admin.masterId
    ) {
      return { ok: false, error: "Чужая запись" };
    }

    await setBookingStatus(data.id, data.status);

    // Award bonus points when a visit is completed. Idempotent.
    if (data.status === "completed") {
      try {
        const accrued = await maybeAccrueBonus(data.id);
        if (accrued && accrued.awarded > 0 && b.tgUserId) {
          const env = getEnv();
          const adminId = env.ADMIN_TELEGRAM_ID ?? "";
          if (String(b.tgUserId) !== String(adminId)) {
            await tgDM(
              b.tgUserId,
              `<b>✨ Вам начислено ${accrued.awarded} бонусов</b>\n\nСпасибо за визит в Bravo! Используйте их при следующей записи.`,
            );
          }
        }
      } catch (e) {
        console.error("[bonus] accrual failed", e);
      }
    }

    if (b.tgUserId) {
      const env = getEnv();
      const adminId = env.ADMIN_TELEGRAM_ID ?? "";
      const dateLabel = new Date(b.startAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      if (String(b.tgUserId) !== String(adminId)) {
        const heading: Record<BookingStatus, string> = {
          confirmed: "✅ Ваша запись подтверждена",
          cancelled: "❌ Ваша запись отменена",
          completed: "💈 Спасибо за визит в Bravo",
          upcoming: "🔄 Статус записи обновлён",
        };
        await tgDM(
          b.tgUserId,
          `<b>${heading[data.status]}</b>\n\n${b.serviceTitle}\n${dateLabel}\n${b.branchName} · ${b.masterName}`,
        );
      }
    }
    return { ok: true };
  });

export const rescheduleBookingFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { initData: string; id: string; newStartAt: string }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    const auth = await authenticate(data.initData);
    if (!auth.ok || !auth.user) return { ok: false, error: "not authenticated" };

    const b = await findBooking(data.id);
    if (!b) return { ok: false, error: "booking not found" };
    if (!auth.isAdmin && b.tgUserId !== auth.user.id) {
      return { ok: false, error: "forbidden" };
    }

    await rescheduleBooking(data.id, data.newStartAt);

    const env = getEnv();
    const adminId = env.ADMIN_TELEGRAM_ID ?? "";
    const oldDate = new Date(b.startAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const newDate = new Date(data.newStartAt).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    if (auth.isAdmin) {
      if (b.tgUserId && String(b.tgUserId) !== String(adminId)) {
        await tgDM(
          b.tgUserId,
          `<b>🔁 Ваша запись перенесена</b>\n\n${b.serviceTitle}\nБыло: ${oldDate}\nСтало: ${newDate}\n${b.branchName}`,
        );
      }
    } else {
      if (adminId) {
        await tgDM(
          adminId,
          `<b>🔁 Клиент перенёс запись</b>\n\n${b.customerName ?? "—"}\n${b.serviceTitle}\nБыло: ${oldDate}\nСтало: ${newDate}`,
        );
      }
    }
    return { ok: true };
  });

/**
 * Public guest booking — no Telegram auth required. Used by the plain web
 * (non-Mini-App) flow. Identifies the customer by phone + name only.
 */
export type CreateGuestBookingFnInput = {
  customerName: string;
  customerPhone: string;
  serviceTitle: string;
  serviceIds?: string[];
  masterId?: string;
  masterName: string;
  branchId?: string;
  branchName: string;
  startAt: string;
  durationMin: number;
  price: number;
  promoId?: string;
};

export const createGuestBookingFn = createServerFn({ method: "POST" })
  .inputValidator((data: CreateGuestBookingFnInput) => data)
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; booking?: ClientBooking; error?: string }> => {
      const name = (data.customerName ?? "").trim();
      const phone = (data.customerPhone ?? "").trim();
      if (!name || !phone) {
        return { ok: false, error: "Имя и телефон обязательны" };
      }

      // Apply promo discount if any.
      let promoDiscount = 0;
      let promoIdToStore: string | null = null;
      if (data.promoId) {
        const env = getEnv();
        const row = await env.DB.prepare(
          `SELECT id, discount_pct, service_ids, active FROM promos WHERE id = ?1`,
        )
          .bind(data.promoId)
          .first<{
            id: string;
            discount_pct: number;
            service_ids: string;
            active: number;
          }>();
        if (row && row.active === 1 && (row.discount_pct ?? 0) > 0) {
          let promoSvcIds: string[] = [];
          try {
            const v = JSON.parse(row.service_ids ?? "[]");
            if (Array.isArray(v)) promoSvcIds = v.map(String);
          } catch {}
          const applies =
            promoSvcIds.length === 0 ||
            (data.serviceIds ?? []).some((id) => promoSvcIds.includes(id));
          if (applies) {
            promoDiscount = Math.floor(
              (data.price * (row.discount_pct ?? 0)) / 100,
            );
            promoIdToStore = row.id;
          }
        }
      }
      const effectivePrice = Math.max(0, data.price - promoDiscount);

      let booking;
      try {
        booking = await createBooking({
          tgUserId: undefined,
          customerName: name,
          customerUsername: undefined,
          serviceTitle: data.serviceTitle,
          serviceIds: data.serviceIds,
          masterId: data.masterId,
          masterName: data.masterName,
          branchId: data.branchId,
          branchName: data.branchName,
          startAt: data.startAt,
          durationMin: data.durationMin,
          price: effectivePrice,
        });
      } catch (e) {
        const msg = (e as Error)?.message ?? String(e);
        if (msg === "SLOT_TAKEN") {
          return {
            ok: false,
            error: "Этот слот только что заняли. Выберите другое время.",
          };
        }
        throw e;
      }

      // Persist promo + phone on the row.
      const env = getEnv();
      if (promoIdToStore) {
        await env.DB.prepare(
          `UPDATE bookings SET promo_id = ?1, promo_discount = ?2 WHERE id = ?3`,
        )
          .bind(promoIdToStore, promoDiscount, booking.id)
          .run();
      }
      // Stash phone in customer_username field as a fallback so admin sees it
      // (we don't have a dedicated guest_phone column to avoid a migration).
      await env.DB.prepare(
        `UPDATE bookings SET customer_username = COALESCE(customer_username, ?1) WHERE id = ?2`,
      )
        .bind(phone, booking.id)
        .run();

      // Notify admin (no user side — guests don't have a TG chat).
      const adminId = env.ADMIN_TELEGRAM_ID ?? "";
      const dateLabel = new Date(booking.startAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      const adminText =
        `<b>🆕 Новая запись Bravo (сайт)</b>\n\n` +
        `<b>Клиент:</b> ${name}\n` +
        `<b>Телефон:</b> ${phone}\n` +
        `<b>Когда:</b> ${dateLabel}\n` +
        `<b>Филиал:</b> ${booking.branchName}\n` +
        `<b>Мастер:</b> ${booking.masterName}\n\n` +
        `<b>Услуга:</b> ${booking.serviceTitle}\n` +
        `<b>Длительность:</b> ${booking.durationMin} мин\n` +
        `<b>Сумма:</b> ${data.price.toLocaleString("ru-RU")} сум` +
        (promoDiscount > 0
          ? `\n<b>Акция:</b> −${promoDiscount.toLocaleString("ru-RU")}` +
            `\n<b>К оплате:</b> ${effectivePrice.toLocaleString("ru-RU")} сум`
          : "");
      if (adminId) await tgDM(adminId, adminText);

      // Notify the assigned master (if linked).
      if (data.masterId) {
        try {
          const masterAdmin = await findMasterAdminForMasterId(data.masterId);
          if (
            masterAdmin?.tg_user_id &&
            String(masterAdmin.tg_user_id) !== String(adminId)
          ) {
            await tgDM(masterAdmin.tg_user_id, adminText);
          }
        } catch (e) {
          console.warn("[guest-booking] notify master failed", e);
        }
      }

      return { ok: true, booking };
    },
  );
