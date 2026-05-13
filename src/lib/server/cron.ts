import { getEnv } from "./env";
import {
  listBookingsNeedingReminder,
  markReminderSent,
  rowToClient,
} from "./booking-db";

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
    return !!data.ok;
  } catch {
    return false;
  }
}

function formatRu(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function runForKind(kind: "24h" | "2h") {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  const adminId = env.ADMIN_TELEGRAM_ID ?? "";
  if (!botToken) return { kind, sent: 0, skipped: 0 };

  const rows = await listBookingsNeedingReminder(kind);
  let sent = 0;
  let skipped = 0;

  for (const r of rows) {
    const b = rowToClient(r);
    const when = formatRu(b.startAt);
    const head = kind === "24h" ? "⏰ Завтра запись" : "⏰ Через 2 часа запись";
    const userText =
      `<b>${head} в Bravo</b>\n\n` +
      `${b.serviceTitle}\n${when}\n${b.branchName}\n${b.masterName}\n\n` +
      `Если нужно отменить или перенести — откройте Mini App.`;
    const adminText =
      `<b>${kind === "24h" ? "📅 За 24ч" : "🔔 За 2ч"}: напоминание клиенту</b>\n\n` +
      `${b.customerName ?? "—"}` +
      (b.customerUsername ? ` (@${b.customerUsername})` : "") +
      `\n${b.serviceTitle}\n${when}\n${b.branchName} · ${b.masterName}`;

    let anySent = false;
    if (b.tgUserId) {
      const ok = await tgSend(botToken, b.tgUserId, userText);
      anySent = anySent || ok;
    }
    if (adminId && String(b.tgUserId) !== String(adminId)) {
      const ok = await tgSend(botToken, adminId, adminText);
      anySent = anySent || ok;
    }

    // Mark as sent regardless — avoid spamming on retries even if Telegram
    // rejected (e.g., user blocked the bot).
    await markReminderSent(b.id, kind);
    if (anySent) sent++;
    else skipped++;
  }
  return { kind, sent, skipped };
}

async function runBirthdayGreetings() {
  const env = getEnv();
  const botToken = env.BOT_TOKEN ?? "";
  if (!botToken) return { sent: 0 };

  // Lazy-import to avoid circular deps and keep this module lean.
  const { listBirthdaysToday, markBirthdaySent } = await import("./customer-db");
  const users = await listBirthdaysToday();
  let sent = 0;
  const year = new Date().getUTCFullYear();
  for (const u of users) {
    const text =
      `<b>🎂 С Днём Рождения, ${u.firstName ?? "друг"}!</b>\n\n` +
      `В подарок — скидка <b>25%</b> на любую услугу в Bravo сегодня.\n\n` +
      `Промокод: <code>BIRTHDAY-25</code>\n\n` +
      `Запишитесь через Mini App.`;
    const ok = await tgSend(botToken, u.tgUserId, text);
    if (ok) sent++;
    await markBirthdaySent(u.tgUserId, year);
  }
  return { sent };
}

export async function runScheduledReminders() {
  const a = await runForKind("24h");
  const b = await runForKind("2h");
  const bd = await runBirthdayGreetings();
  console.log("[cron] reminders:", a, b, "bday:", bd);
}
