import { useEffect, useState } from "react";
import { verifyTelegramFn, type AuthResult } from "./telegram-auth";

type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData: string;
  initDataUnsafe?: { user?: TelegramWebAppUser; start_param?: string };
  version?: string;
  ready?: () => void;
  expand?: () => void;
  close?: () => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  disableClosingConfirmation?: () => void;
  isVersionAtLeast?: (v: string) => boolean;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton?: {
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setText: (t: string) => void;
    setParams: (p: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "soft" | "rigid") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  return window.Telegram?.WebApp ?? null;
}

async function waitForTelegram(timeoutMs = 3000): Promise<TelegramWebApp | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const tg = getTelegramWebApp();
    if (tg) return tg;
    await new Promise((r) => setTimeout(r, 50));
  }
  return getTelegramWebApp();
}

let cachedAuth: Promise<AuthResult> | null = null;

export function useTelegramAuth(): {
  loading: boolean;
  result: AuthResult | null;
} {
  const [state, setState] = useState<{ loading: boolean; result: AuthResult | null }>(
    { loading: true, result: null },
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const tg = await waitForTelegram(3000);
      const initData = tg?.initData ?? "";
      if (tg) {
        try { tg.ready?.(); } catch {}
        try { tg.expand?.(); } catch {}
      }
      if (!initData) {
        if (!cancelled) {
          setState({
            loading: false,
            result: { ok: false, user: null, isAdmin: false },
          });
        }
        return;
      }
      if (!cachedAuth) {
        cachedAuth = verifyTelegramFn({ data: { initData } }).catch(
          (e): AuthResult => {
            console.error("[telegram] verify failed", e);
            return { ok: false, user: null, isAdmin: false };
          },
        );
      }
      const r = await cachedAuth;
      if (!cancelled) setState({ loading: false, result: r });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function haptic(
  kind:
    | "light"
    | "medium"
    | "heavy"
    | "soft"
    | "rigid"
    | "success"
    | "error"
    | "warning"
    | "select",
) {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;
  try {
    if (kind === "success" || kind === "error" || kind === "warning") {
      tg.HapticFeedback.notificationOccurred(kind);
    } else if (kind === "select") {
      tg.HapticFeedback.selectionChanged();
    } else {
      tg.HapticFeedback.impactOccurred(kind);
    }
  } catch {}
}

export function useTelegramBackButton(onBack: () => void, enabled = true) {
  useEffect(() => {
    const tg = getTelegramWebApp();
    const bb = tg?.BackButton;
    if (!bb || !enabled) return;
    const handler = () => onBack();
    try {
      bb.onClick(handler);
      bb.show();
    } catch {}
    return () => {
      try {
        bb.offClick(handler);
        bb.hide();
      } catch {}
    };
  }, [onBack, enabled]);
}

export function useTelegramMainButton(
  text: string,
  onClick: () => void,
  opts: { visible?: boolean; enabled?: boolean } = {},
) {
  const { visible = true, enabled = true } = opts;
  useEffect(() => {
    const tg = getTelegramWebApp();
    const mb = tg?.MainButton;
    if (!mb) return;
    const handler = () => onClick();
    try {
      mb.setText(text);
      mb.onClick(handler);
      if (visible) mb.show();
      else mb.hide();
      if (enabled) mb.enable();
      else mb.disable();
    } catch {}
    return () => {
      try {
        mb.offClick(handler);
        mb.hide();
      } catch {}
    };
  }, [text, onClick, visible, enabled]);
}

export function applyTelegramTheme() {
  if (typeof window === "undefined") return;
  const tg = getTelegramWebApp();
  if (!tg) return;
  try {
    tg.setHeaderColor?.("#2A1810");
    tg.setBackgroundColor?.("#2A1810");
    // Prevent Telegram from intercepting touch gestures so horizontal scroll
    // inside the app (chips, carousels) works. Available since Bot API 7.7.
    if (tg.isVersionAtLeast?.("7.7")) tg.disableVerticalSwipes?.();
  } catch {}
}
