import { useEffect, useState } from "react";

export type Lang = "ru" | "uz";
const KEY = "lume_lang_v1";

function read(): Lang {
  if (typeof window === "undefined") return "ru";
  const v = localStorage.getItem(KEY);
  return v === "uz" ? "uz" : "ru";
}

const listeners = new Set<() => void>();

export function getLang(): Lang {
  return read();
}

export function setLang(lang: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, lang);
  document.documentElement.lang = lang;
  listeners.forEach((l) => l());
}

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, set] = useState<Lang>("ru");
  useEffect(() => {
    set(read());
    const fn = () => set(read());
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [lang, setLang];
}
