import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getTelegramWebApp } from "./telegram-client";
import {
  subscribePushFn,
  unsubscribePushFn,
  getVapidPublicKeyFn,
} from "./push-fn";

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bufToB64Url(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const arr = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function pushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration("/sw.js")) ??
      (await navigator.serviceWorker.register("/sw.js"));
    return reg;
  } catch (e) {
    console.warn("[push] sw register failed", e);
    return null;
  }
}

export function useVapidKey() {
  return useQuery({
    queryKey: ["push", "vapid"],
    queryFn: () => getVapidPublicKeyFn({ data: {} }),
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function usePushStatus() {
  // (subscribed, supported, permission)
  const [state, setState] = useState<{
    supported: boolean;
    permission: NotificationPermission | "unsupported";
    subscribed: boolean;
  }>({ supported: false, permission: "default", subscribed: false });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supported = pushSupported();
      if (!supported) {
        if (!cancelled)
          setState({ supported: false, permission: "unsupported", subscribed: false });
        return;
      }
      const reg = await ensureServiceWorker();
      const sub = await reg?.pushManager.getSubscription();
      if (!cancelled) {
        setState({
          supported: true,
          permission: Notification.permission,
          subscribed: !!sub,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return [state, setState] as const;
}

export function useSubscribePush() {
  return useMutation({
    mutationFn: async (vapidKey: string) => {
      const reg = await ensureServiceWorker();
      if (!reg) return { ok: false as const, error: "no service worker" };
      // Ask permission.
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return { ok: false as const, error: perm };
      // Subscribe.
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        }));
      const initData = getTelegramWebApp()?.initData ?? "";
      await subscribePushFn({
        data: {
          initData,
          endpoint: sub.endpoint,
          p256dh: bufToB64Url(sub.getKey?.("p256dh") ?? null),
          auth: bufToB64Url(sub.getKey?.("auth") ?? null),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        },
      });
      return { ok: true as const };
    },
  });
}

export function useUnsubscribePush() {
  return useMutation({
    mutationFn: async () => {
      const reg = await ensureServiceWorker();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return { ok: true as const };
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await unsubscribePushFn({ data: { endpoint } });
      return { ok: true as const };
    },
  });
}
