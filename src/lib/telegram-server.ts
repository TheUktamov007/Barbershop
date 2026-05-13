// Server-only Telegram WebApp initData validator. Uses Web Crypto API (works on
// Cloudflare Workers and Node 18+).

export type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
};

async function hmacSha256(keyData: Uint8Array, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(sig);
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSec = 24 * 60 * 60,
): Promise<TelegramUser | null> {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = await hmacSha256(
    new TextEncoder().encode("WebAppData"),
    botToken,
  );
  const computed = await hmacSha256(secretKey, dataCheckString);
  if (toHex(computed) !== hash) return null;

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > maxAgeSec) {
    return null;
  }

  const userJson = params.get("user");
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as TelegramUser;
  } catch {
    return null;
  }
}
