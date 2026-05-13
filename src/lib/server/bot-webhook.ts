import { getEnv } from "./env";
import { listBookingsForUser } from "./booking-db";
import { getOrCreateCustomer } from "./customer-db";

type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgChat = { id: number; type: string };

type TgMessage = {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
};

type TgCallbackQuery = {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
};

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: TgCallbackQuery;
};

const MINI_APP_URL = "https://tanstack-start-app.bravobarber.workers.dev";

async function tgApi(
  method: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  if (!botToken) return { ok: false };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    return { ok: !!data.ok };
  } catch {
    return { ok: false };
  }
}

function inlineWebAppButton(text: string, path = "") {
  return {
    inline_keyboard: [
      [{ text, web_app: { url: MINI_APP_URL + path } }],
    ],
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function onStart(msg: TgMessage) {
  const name = msg.from?.first_name ?? "друг";
  // Register the user in customers table so admin sees them right after /start,
  // not only after their first booking.
  if (msg.from?.id) {
    try {
      await getOrCreateCustomer({
        tgUserId: msg.from.id,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        username: msg.from.username,
      });
    } catch (e) {
      console.warn("[bot] /start: getOrCreateCustomer failed", e);
    }
  }
  const text =
    `<b>Добро пожаловать в Bravo Barbershop ✂️</b>\n\n` +
    `${name}, мы рады вас видеть! Запишитесь онлайн за минуту — нажмите кнопку ниже.\n\n` +
    `Команды бота:\n` +
    `/book — записаться\n` +
    `/my — мои записи\n` +
    `/help — помощь`;
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text,
    parse_mode: "HTML",
    reply_markup: inlineWebAppButton("✂️ Открыть Bravo", "/"),
  });
}

async function onBook(msg: TgMessage) {
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text: "Записаться онлайн:",
    reply_markup: inlineWebAppButton("📅 Записаться", "/booking"),
  });
}

async function onMy(msg: TgMessage) {
  const userId = msg.from?.id;
  if (!userId) return;
  const bookings = await listBookingsForUser(userId);
  const active = bookings.filter(
    (b) => b.status === "upcoming" || b.status === "confirmed",
  );
  if (active.length === 0) {
    await tgApi("sendMessage", {
      chat_id: msg.chat.id,
      text: "У вас нет активных записей. Записаться?",
      reply_markup: inlineWebAppButton("📅 Записаться", "/booking"),
    });
    return;
  }
  const lines = active
    .slice(0, 5)
    .map(
      (b, i) =>
        `<b>${i + 1}.</b> ${b.serviceTitle}\n` +
        `   ${fmtDate(b.startAt)}\n` +
        `   ${b.branchName} · ${b.masterName}`,
    )
    .join("\n\n");
  const more = active.length > 5 ? `\n\n…и ещё ${active.length - 5}` : "";
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text: `<b>Ваши записи:</b>\n\n${lines}${more}`,
    parse_mode: "HTML",
    reply_markup: inlineWebAppButton("👤 Открыть профиль", "/profile"),
  });
}

async function onHelp(msg: TgMessage) {
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text:
      `<b>Bravo — премиальный барбершоп</b>\n\n` +
      `/start — главное меню\n` +
      `/book — записаться\n` +
      `/my — мои записи\n` +
      `/help — это сообщение\n\n` +
      `Все услуги, барберы и адреса филиалов — в нашем Mini App. ⤵️`,
    parse_mode: "HTML",
    reply_markup: inlineWebAppButton("✂️ Открыть Bravo", "/"),
  });
}

async function onFallback(msg: TgMessage) {
  await tgApi("sendMessage", {
    chat_id: msg.chat.id,
    text:
      "Не понял команду 😅 Попробуйте /start, /book или откройте Mini App ниже.",
    reply_markup: inlineWebAppButton("✂️ Открыть Bravo", "/"),
  });
}

export async function handleTelegramUpdate(update: TgUpdate): Promise<void> {
  const msg = update.message;
  if (!msg || !msg.text) return;
  const cmd = msg.text.trim().split(/\s+/)[0].toLowerCase().split("@")[0];

  switch (cmd) {
    case "/start":
      return onStart(msg);
    case "/book":
    case "/booking":
      return onBook(msg);
    case "/my":
    case "/mybookings":
      return onMy(msg);
    case "/help":
      return onHelp(msg);
    default:
      return onFallback(msg);
  }
}

/**
 * Set the bot menu commands and Mini App button at startup. Call manually
 * via a "set up bot" admin action or on first deploy.
 */
export async function setBotCommands(): Promise<void> {
  await tgApi("setMyCommands", {
    commands: [
      { command: "start", description: "Главное меню" },
      { command: "book", description: "Записаться онлайн" },
      { command: "my", description: "Мои записи" },
      { command: "help", description: "Помощь" },
    ],
  });
  await tgApi("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "✂️ Bravo",
      web_app: { url: MINI_APP_URL },
    },
  });
}
