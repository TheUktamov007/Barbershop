import { useLang, type Lang } from "./lang";
import { useT } from "./i18n";

/**
 * Pick the right field based on current language. Falls back to base RU value
 * when UZ translation is empty/null/undefined.
 */
export function pickLocale<T extends string | undefined>(
  ru: T,
  uz: T | undefined | null,
  lang: Lang,
): T {
  if (lang === "uz" && uz && String(uz).trim()) return uz;
  return ru;
}

/** Hook variant — reads current language from context. */
export function useLocalize() {
  const [lang] = useLang();
  return (ru: string, uz?: string | null) =>
    lang === "uz" && uz && uz.trim() ? uz : ru;
}

/**
 * Localize a category id (e.g. "haircut") using the existing i18n dict.
 */
export function useLocalizeCategory() {
  const t = useT();
  return (categoryId: string): string => {
    switch (categoryId) {
      case "haircut":
        return t("cat.haircut");
      case "beard":
        return t("cat.beard");
      case "shave":
        return t("cat.shave");
      case "kids":
        return t("cat.kids");
      case "coloring":
        return t("cat.coloring");
      case "styling":
        return t("cat.styling");
      case "combo":
        return t("cat.combo");
      default:
        return categoryId;
    }
  };
}
