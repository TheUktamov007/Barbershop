import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import { useLang } from "@/lib/lang";

export function PromoSlider() {
  const t = useT();
  const [lang] = useLang();
  const { promos } = useStore();

  // Show at most 5 latest promos. If admin deleted all, hide the section.
  const slides = (promos ?? []).slice(0, 5);
  if (slides.length === 0) return null;

  // Pick UZ title/description when available and lang === "uz".
  const pick = (ru: string, uz?: string) =>
    lang === "uz" && uz && uz.trim() ? uz : ru;

  return (
    <section className="px-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold text-bg-ivory">
          {t("home.trending")}{" "}
          <span className="font-serif-italic text-accent">{t("home.trending.suffix")}</span>
        </h2>
        <Link to="/promos" className="caption text-accent">
          {t("home.promos_link")}
        </Link>
      </div>
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s) => {
          const title = pick(s.title, s.titleUz);
          const desc = pick(s.description, s.descriptionUz);
          const badge = pick(s.badge, s.badgeUz);
          const until = pick(s.validUntil, s.validUntilUz);
          return (
            <Link
              key={s.id}
              to="/promos"
              className="relative h-44 w-[78%] shrink-0 snap-start overflow-hidden rounded-[24px] active:scale-[0.98] transition-transform"
            >
              <img
                src={s.image}
                alt={title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/85 via-bg-deep/20 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-4 text-bg-ivory">
                <span className="w-fit rounded-pill bg-accent px-2.5 py-1 text-[10px] font-semibold tracking-wide text-accent-foreground">
                  {badge}
                </span>
                <h3 className="mt-2 text-lg font-semibold leading-tight line-clamp-2">
                  {title}
                </h3>
                <p className="text-[12px] text-bg-ivory/70 line-clamp-1">
                  {desc || until}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
