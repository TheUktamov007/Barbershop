import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { runWithEnv, type Env } from "./lib/server/env";
import { runScheduledReminders } from "./lib/server/cron";
import { handleTelegramUpdate, setBotCommands } from "./lib/server/bot-webhook";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return false;
  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((k) => expectedKeys.has(k))) return false;
  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: Env, ctx: unknown) {
    // Stash env in AsyncLocalStorage so server functions can read DB/secrets
    // via getEnv(). Cloudflare bindings (D1, KV, etc.) aren't on process.env.
    return runWithEnv(env, async () => {
      try {
        const url = new URL(request.url);

        // Telegram webhook: Bot API POSTs updates here.
        // The path is set via setWebhook + secret_token check (X-Telegram-Bot-Api-Secret-Token).
        if (url.pathname === "/api/telegram/webhook") {
          if (request.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
          }
          const secret = env.TG_WEBHOOK_SECRET ?? "";
          if (
            secret &&
            request.headers.get("x-telegram-bot-api-secret-token") !== secret
          ) {
            return new Response("Forbidden", { status: 403 });
          }
          try {
            const update = (await request.json()) as Parameters<
              typeof handleTelegramUpdate
            >[0];
            await handleTelegramUpdate(update);
          } catch (e) {
            console.error("[webhook] handler error", e);
          }
          return new Response("ok", { status: 200 });
        }

        // Public photo serve. Streams object from R2 with long cache.
        if (url.pathname.startsWith("/api/photos/")) {
          if (request.method !== "GET" && request.method !== "HEAD") {
            return new Response("Method not allowed", { status: 405 });
          }
          const key = decodeURIComponent(url.pathname.slice("/api/photos/".length));
          if (!key || !env.PHOTOS) return new Response("Not found", { status: 404 });
          const obj = await env.PHOTOS.get(key);
          if (!obj) return new Response("Not found", { status: 404 });
          return new Response(obj.body, {
            headers: {
              "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream",
              "cache-control": "public, max-age=31536000, immutable",
              etag: obj.httpEtag,
            },
          });
        }

        // One-shot setup endpoint: registers /commands and Mini App menu button.
        // Auth via ADMIN_PASSWORD secret as ?key= query param.
        if (url.pathname === "/api/telegram/setup") {
          const key = url.searchParams.get("key") ?? "";
          if (!env.ADMIN_PASSWORD || key !== env.ADMIN_PASSWORD) {
            return new Response("Forbidden", { status: 403 });
          }
          await setBotCommands();
          return new Response("bot commands + menu button set", { status: 200 });
        }

        const handler = await getServerEntry();
        const response = await handler.fetch(request, env, ctx);
        return await normalizeCatastrophicSsrResponse(response);
      } catch (error) {
        console.error(error);
        return brandedErrorResponse();
      }
    });
  },

  // Cron trigger handler. Wrangler `triggers.crons` invokes this on schedule.
  // Used to send booking reminders (24h, 2h before).
  async scheduled(
    event: { cron: string; scheduledTime: number },
    env: Env,
    ctx: { waitUntil: (p: Promise<unknown>) => void },
  ) {
    ctx.waitUntil(
      runWithEnv(env, async () => {
        try {
          await runScheduledReminders();
        } catch (e) {
          console.error("[cron] reminder run failed:", e);
        }
      }),
    );
  },
};
