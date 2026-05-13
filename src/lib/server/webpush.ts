// Minimal Web Push sender for Cloudflare Workers. Signs VAPID JWT with
// Web Crypto API and POSTs to the subscription endpoint.
//
// Encryption (aes128gcm) is NON-trivial; many push services accept an empty
// body with a Topic / TTL — we use that lightweight path: just notify, then
// the service worker can re-fetch fresh data. To pass a payload we'd need
// to implement ECE encryption — out of scope here.

import { getEnv } from "./env";

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Import a VAPID raw private key (URL-safe base64 of 32-byte scalar)
 * as a CryptoKey suitable for ECDSA P-256 signing.
 */
async function importVapidPrivateKey(b64url: string): Promise<CryptoKey> {
  const d = b64urlDecode(b64url);
  if (d.length !== 32) throw new Error("VAPID private key must be 32 bytes");

  // JWK requires "d" plus the matching public key. Derive (x,y) from public key.
  const env = getEnv();
  const pub = env.VAPID_PUBLIC_KEY ?? "";
  const pubBytes = b64urlDecode(pub);
  if (pubBytes.length !== 65 || pubBytes[0] !== 0x04) {
    throw new Error("VAPID public key must be 65 bytes uncompressed P-256");
  }
  const x = b64urlEncode(pubBytes.slice(1, 33));
  const y = b64urlEncode(pubBytes.slice(33, 65));

  return crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: b64url,
      x,
      y,
      ext: true,
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function signJwt(payload: object, privKey: CryptoKey): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const enc = new TextEncoder();
  const headerB64 = b64urlEncode(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privKey,
    enc.encode(data),
  );
  return `${data}.${b64urlEncode(sig)}`;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string; // not used (no payload encryption)
  auth: string;
};

/**
 * Send a push to one subscription. Returns true if delivered (or queued).
 * No payload — service worker should fetch fresh data on receive.
 */
export async function sendWebPush(
  sub: PushSubscriptionRow,
  ttlSec = 60 * 60 * 12,
): Promise<{ ok: boolean; status: number }> {
  const env = getEnv();
  const pub = env.VAPID_PUBLIC_KEY ?? "";
  const priv = env.VAPID_PRIVATE_KEY ?? "";
  const subject = env.VAPID_SUBJECT ?? "mailto:admin@bravo.local";
  if (!pub || !priv) return { ok: false, status: 0 };

  const url = new URL(sub.endpoint);
  const aud = `${url.protocol}//${url.host}`;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud,
    exp: now + 12 * 60 * 60,
    sub: subject,
  };
  const privKey = await importVapidPrivateKey(priv);
  const jwt = await signJwt(payload, privKey);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: String(ttlSec),
      Authorization: `vapid t=${jwt}, k=${pub}`,
      "Content-Length": "0",
      Urgency: "normal",
    },
    body: undefined,
  });
  return { ok: res.ok || res.status === 201, status: res.status };
}

/** Send to many subs; prune dead ones (404/410). */
export async function pushToUser(tgUserId: number): Promise<{ sent: number; pruned: number }> {
  const { DB } = getEnv();
  const { results } = await DB.prepare(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE tg_user_id = ?1`,
  )
    .bind(tgUserId)
    .all<PushSubscriptionRow>();
  let sent = 0;
  let pruned = 0;
  for (const r of results ?? []) {
    try {
      const out = await sendWebPush(r);
      if (out.status === 404 || out.status === 410) {
        await DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?1`)
          .bind(r.endpoint)
          .run();
        pruned++;
      } else if (out.ok) {
        await DB.prepare(
          `UPDATE push_subscriptions SET last_used_at = unixepoch(), failed_count = 0 WHERE endpoint = ?1`,
        )
          .bind(r.endpoint)
          .run();
        sent++;
      } else {
        await DB.prepare(
          `UPDATE push_subscriptions SET failed_count = failed_count + 1 WHERE endpoint = ?1`,
        )
          .bind(r.endpoint)
          .run();
      }
    } catch (e) {
      console.warn("[push] send failed", e);
    }
  }
  return { sent, pruned };
}
