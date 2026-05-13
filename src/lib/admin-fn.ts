import { createServerFn } from "@tanstack/react-start";
import { checkAdmin } from "./server/admin-auth";
import {
  createAdminBooking,
  setBookingStatus,
  findBooking,
  type ClientBooking,
} from "./server/booking-db";
import {
  listAllCustomers,
  setCustomerAdminNote,
  getCustomer,
  type CustomerProfile,
} from "./server/customer-db";
import { getEnv } from "./server/env";

type AdminAuth = {
  initData?: string;
  adminPass?: string;
  sessionToken?: string;
};

async function requireAdmin(creds: AdminAuth) {
  const a = await checkAdmin(creds);
  return a.isAdmin;
}

// ---------- Manual booking (walk-in/phone) ----------

export const createAdminBookingFn = createServerFn({ method: "POST" })
  .inputValidator(
    (
      data: AdminAuth & {
        customerName?: string;
        customerPhone?: string;
        serviceTitle: string;
        serviceIds?: string[];
        masterId?: string;
        masterName: string;
        branchId?: string;
        branchName: string;
        startAt: string;
        durationMin: number;
        price: number;
      },
    ) => data,
  )
  .handler(
    async ({ data }): Promise<{ ok: boolean; booking?: ClientBooking; error?: string }> => {
      if (!(await requireAdmin(data))) {
        return { ok: false, error: "admin only" };
      }
      // Pack the phone into the customer_name suffix so admin can see it later.
      const name =
        (data.customerName ?? "Walk-in") +
        (data.customerPhone ? ` · ${data.customerPhone}` : "");
      const booking = await createAdminBooking({
        customerName: name,
        customerPhone: data.customerPhone,
        serviceTitle: data.serviceTitle,
        serviceIds: data.serviceIds,
        masterId: data.masterId,
        masterName: data.masterName,
        branchId: data.branchId,
        branchName: data.branchName,
        startAt: data.startAt,
        durationMin: data.durationMin,
        price: data.price,
      });
      return { ok: true, booking };
    },
  );

// ---------- Cancellation with reason / no-show ----------

export const adminSetBookingStatusFn = createServerFn({ method: "POST" })
  .inputValidator(
    (
      data: AdminAuth & {
        id: string;
        status: "upcoming" | "confirmed" | "completed" | "cancelled" | "no_show";
        cancelReason?: string;
      },
    ) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await requireAdmin(data))) {
      return { ok: false, error: "admin only" };
    }
    const b = await findBooking(data.id);
    if (!b) return { ok: false, error: "not found" };
    await setBookingStatus(data.id, data.status, data.cancelReason);

    // Notify client when cancelled by admin.
    if (
      data.status === "cancelled" &&
      b.tgUserId &&
      String(b.tgUserId) !== String(getEnv().ADMIN_TELEGRAM_ID ?? "")
    ) {
      const botToken = getEnv().BOT_TOKEN ?? "";
      if (botToken) {
        const dateLabel = new Date(b.startAt).toLocaleString("ru-RU", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        });
        const reason = data.cancelReason ? `\n\nПричина: ${data.cancelReason}` : "";
        await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              chat_id: b.tgUserId,
              text:
                `<b>❌ Ваша запись отменена</b>\n\n${b.serviceTitle}\n${dateLabel}\n${b.branchName}${reason}`,
              parse_mode: "HTML",
            }),
          },
        ).catch(() => {});
      }
    }
    return { ok: true };
  });

// ---------- Customers (CRM) ----------

export const listCustomersFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth) => data)
  .handler(async ({ data }): Promise<CustomerProfile[]> => {
    if (!(await requireAdmin(data))) return [];
    return await listAllCustomers();
  });

export const getCustomerDetailFn = createServerFn({ method: "POST" })
  .inputValidator((data: AdminAuth & { tgUserId: number }) => data)
  .handler(async ({ data }): Promise<CustomerProfile | null> => {
    if (!(await requireAdmin(data))) return null;
    return await getCustomer(data.tgUserId);
  });

export const setCustomerNoteFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: AdminAuth & { tgUserId: number; note: string | null }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!(await requireAdmin(data))) return { ok: false, error: "admin only" };
    const trimmed = data.note?.trim();
    await setCustomerAdminNote(data.tgUserId, trimmed ? trimmed.slice(0, 2000) : null);
    return { ok: true };
  });
