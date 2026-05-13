import { createServerFn } from "@tanstack/react-start";
import { checkAdmin } from "./server/admin-auth";
import { getEnv } from "./server/env";

type AdminAuth = { initData?: string; adminPass?: string };

// Accept up to ~5 MB of base64 (effective ~3.7 MB binary). Bigger images get
// rejected — admin should compress in the browser first.
const MAX_BYTES = 5_000_000;

function decodeBase64DataUrl(b64: string): { type: string; bytes: Uint8Array } | null {
  // Accepts "data:image/jpeg;base64,...." or raw base64.
  let type = "image/jpeg";
  let payload = b64;
  if (b64.startsWith("data:")) {
    const m = b64.match(/^data:([^;]+);base64,(.*)$/);
    if (!m) return null;
    type = m[1];
    payload = m[2];
  }
  try {
    const bin = atob(payload);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { type, bytes };
  } catch {
    return null;
  }
}

export const uploadPhotoFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: AdminAuth & { dataUrl: string; folder?: "services" | "branches" | "masters" | "promos" | "reviews" }) =>
      data,
  )
  .handler(
    async ({ data }): Promise<{ ok: boolean; url?: string; error?: string }> => {
      const auth = await checkAdmin(data);
      if (!auth.isAdmin) return { ok: false, error: "admin only" };

      const env = getEnv();
      if (!env.PHOTOS) {
        return { ok: false, error: "R2 bucket PHOTOS not bound. Add to wrangler.jsonc." };
      }
      const decoded = decodeBase64DataUrl(data.dataUrl);
      if (!decoded) return { ok: false, error: "Invalid image data" };
      if (decoded.bytes.byteLength > MAX_BYTES) {
        return { ok: false, error: "Файл слишком большой (макс 5 МБ)" };
      }
      if (!decoded.type.startsWith("image/")) {
        return { ok: false, error: "Нужно изображение" };
      }

      const folder = data.folder ?? "services";
      const ext =
        decoded.type === "image/png"
          ? "png"
          : decoded.type === "image/webp"
            ? "webp"
            : decoded.type === "image/avif"
              ? "avif"
              : "jpg";
      const key = `${folder}/${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      await env.PHOTOS.put(key, decoded.bytes.buffer as ArrayBuffer, {
        httpMetadata: {
          contentType: decoded.type,
          cacheControl: "public, max-age=31536000, immutable",
        },
      });

      // Serve via the /api/photos/* route below.
      return { ok: true, url: `/api/photos/${key}` };
    },
  );
