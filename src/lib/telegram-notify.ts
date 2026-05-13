import { createServerFn } from "@tanstack/react-start";
import { validateInitData } from "./telegram-server";

type NotifyInput = {
  initData: string;
  adminText?: string;
  userText?: string;
  // Telegram user id (chat id) of the customer. Required to DM them.
  userId?: number;
};

type NotifyResult = {
  ok: boolean;
  adminSent: boolean;
  userSent: boolean;
  error?: string;
};

async function tgSend(botToken: string, chatId: number | string, text: string) {
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
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
    };
    return { ok: !!data.ok, description: data.description };
  } catch (e) {
    return { ok: false, description: String(e) };
  }
}

export const notifyBookingFn = createServerFn({ method: "POST" })
  .inputValidator((data: NotifyInput) => data)
  .handler(async ({ data }): Promise<NotifyResult> => {
    const botToken =
      (typeof process !== "undefined" && process.env?.BOT_TOKEN) || "";
    const adminId =
      (typeof process !== "undefined" && process.env?.ADMIN_TELEGRAM_ID) || "";

    if (!botToken) {
      return {
        ok: false,
        adminSent: false,
        userSent: false,
        error: "BOT_TOKEN not set",
      };
    }

    const user = await validateInitData(data.initData ?? "", botToken);
    if (!user) {
      return {
        ok: false,
        adminSent: false,
        userSent: false,
        error: "invalid initData",
      };
    }

    let adminSent = false;
    let userSent = false;

    if (data.adminText && adminId) {
      const r = await tgSend(botToken, adminId, data.adminText);
      adminSent = !!r.ok;
    }

    if (data.userText && data.userId && String(data.userId) !== String(adminId)) {
      const r = await tgSend(botToken, data.userId, data.userText);
      userSent = !!r.ok;
    }

    return { ok: true, adminSent, userSent };
  });
