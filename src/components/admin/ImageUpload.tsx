import { useState } from "react";
import { adminAuthPayload } from "@/lib/admin-creds";
import { uploadPhotoFn } from "@/lib/photos-fn";

type Folder = "services" | "branches" | "masters" | "promos" | "reviews";

/**
 * Inline image picker: shows current image (if any), lets admin pick a file,
 * uploads to R2, and calls onChange with the resulting URL.
 *
 * Caller is responsible for storing the URL into the entity (it just gives
 * a /api/photos/... path).
 */
export function ImageUpload({
  value,
  onChange,
  folder = "services",
  label = "Изображение",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: Folder;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(new Error("read fail"));
        r.readAsDataURL(file);
      });
      const r = await uploadPhotoFn({
        data: { ...adminAuthPayload(), dataUrl, folder },
      });
      if (r.ok && r.url) {
        onChange(r.url);
      } else {
        setErr(r.error ?? "Не удалось загрузить");
      }
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <div className="flex items-center gap-2">
        {value && (
          <img
            src={value}
            alt=""
            className="h-16 w-16 rounded-md object-cover border border-bg-ivory/15"
          />
        )}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="/api/photos/... или /assets/...jpg"
            className="w-full rounded-md border border-bg-ivory/15 bg-bg-ivory/5 px-2 py-1.5 text-[13px] text-bg-ivory"
          />
          <div className="mt-1.5 flex items-center gap-2">
            <label className="inline-flex items-center gap-1 rounded-pill bg-accent/20 px-3 py-1 text-[11px] font-semibold text-accent cursor-pointer hover:bg-accent/30">
              {busy ? "..." : "↑ Загрузить файл"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-pill bg-bg-ivory/10 px-2 py-1 text-[11px] text-bg-ivory hover:bg-bg-ivory/15"
              >
                Очистить
              </button>
            )}
          </div>
          {err && <p className="mt-1 text-[11px] text-red-400">{err}</p>}
          <p className="mt-1 text-[10px] text-bg-ivory/50">
            JPG/PNG/WebP до 5 МБ. Сохраняется в Cloudflare R2.
          </p>
        </div>
      </div>
    </div>
  );
}
