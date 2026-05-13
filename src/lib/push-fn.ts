import { createServerFn } from "@tanstack/react-start";
import { checkUser } from "./server/admin-auth";
import { getEnv } from "./server/env";

export const subscribePushFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      initData?: string;
      endpoint: string;
      p256dh: string;
      auth: string;
      userAgent?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    if (!data.endpoint || !data.p256dh || !data.auth) {
      return { ok: false, error: "invalid subscription" };
    }
    const a = data.initData ? await checkUser(data.initData) : null;
    const tgUserId = a?.user?.id ?? null;

    const env = getEnv();
    await env.DB.prepare(
      `INSERT INTO push_subscriptions (tg_user_id, endpoint, p256dh, auth, user_agent)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(endpoint) DO UPDATE SET
         tg_user_id = COALESCE(excluded.tg_user_id, push_subscriptions.tg_user_id),
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         user_agent = COALESCE(excluded.user_agent, push_subscriptions.user_agent),
         failed_count = 0`,
    )
      .bind(
        tgUserId,
        data.endpoint,
        data.p256dh,
        data.auth,
        data.userAgent ?? null,
      )
      .run();
    return { ok: true };
  });

export const unsubscribePushFn = createServerFn({ method: "POST" })
  .inputValidator((data: { endpoint: string }) => data)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const env = getEnv();
    await env.DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?1`)
      .bind(data.endpoint)
      .run();
    return { ok: true };
  });

/** Returns VAPID public key for the client to subscribe. */
export const getVapidPublicKeyFn = createServerFn({ method: "POST" })
  .inputValidator(() => ({}))
  .handler(async (): Promise<{ ok: boolean; key?: string }> => {
    const env = getEnv();
    const key = env.VAPID_PUBLIC_KEY ?? "";
    if (!key) return { ok: false };
    return { ok: true, key };
  });
