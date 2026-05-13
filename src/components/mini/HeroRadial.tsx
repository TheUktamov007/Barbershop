import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

const bannerImg = "/assets/bannerr.jpg";

export function HeroRadial() {
  const t = useT();
  const [lang] = useLang();
  return (
    <section className="relative overflow-hidden rounded-b-[36px] text-bg-ivory">
      {/* Full-bleed banner image */}
      <div className="relative">
        <img
          src={bannerImg}
          alt="Bravo Barbershop"
          fetchPriority="high"
          className="aspect-[4/5] w-full object-cover"
        />
        {/* dark gradient overlay for readable text */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-deep/40 via-bg-deep/30 to-bg-deep" />
        {/* accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 40% at 50% 30%, oklch(0.90 0.18 100 / 0.22), transparent 60%)",
          }}
        />

        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-8">
          <span className="caption inline-flex items-center gap-1.5 text-accent">
            <Scissors className="h-3.5 w-3.5" strokeWidth={2} />
            BRAVO · Barbershop
          </span>
          <span className="caption text-bg-ivory/60">{lang.toUpperCase()}</span>
        </header>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-8 text-center">
          <span className="caption text-bg-ivory/65">{t("hero.network")}</span>
          <h1 className="mt-2 text-[40px] leading-[0.95] font-extrabold uppercase tracking-tight">
            {t("hero.title.a")}
            <br />
            {t("hero.title.b")}{" "}
            <span className="font-serif-italic normal-case text-accent">
              {t("hero.title.italic")}
            </span>{" "}
            {t("hero.title.c")}
          </h1>
          <p className="mt-3 max-w-[20rem] text-[13px] leading-relaxed text-bg-ivory/75">
            {t("hero.subtitle")}
          </p>

          <div className="mt-5 flex w-full max-w-xs items-center justify-center gap-2">
            <Button asChild variant="pill-accent" size="lg" className="flex-1">
              <Link to="/booking">{t("btn.book_now")}</Link>
            </Button>
            <Button asChild variant="pill-outline" size="lg" className="flex-1">
              <Link to="/services">{t("nav.services")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
