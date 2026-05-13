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
    <section className="relative overflow-hidden rounded-b-[36px] text-bg-ivory bg-bg-deep">
      <div className="relative aspect-[3/4] w-full">
        <img
          src={bannerImg}
          alt="Bravo Barbershop"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Bottom-heavy gradient: face stays visible, headline gets dark backdrop */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.13 0 0 / 0.25) 0%, transparent 25%, transparent 50%, oklch(0.13 0 0 / 0.8) 75%, oklch(0.13 0 0) 100%)",
          }}
        />

        {/* Top chip */}
        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-7">
          <span className="caption inline-flex items-center gap-1.5 text-accent">
            <Scissors className="h-3.5 w-3.5" strokeWidth={2} />
            BRAVO · BARBERSHOP
          </span>
          <span className="caption text-bg-ivory/70">{lang.toUpperCase()}</span>
        </header>

        {/* Headline overlaid on lower half of the image */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-6 text-center">
          <span className="caption text-bg-ivory/80">{t("hero.network")}</span>
          <h1 className="mt-2 text-[34px] sm:text-[40px] leading-[0.95] font-extrabold uppercase tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {t("hero.title.a")}
            <br />
            {t("hero.title.b")}{" "}
            <span className="font-serif-italic normal-case text-accent">
              {t("hero.title.italic")}
            </span>{" "}
            {t("hero.title.c")}
          </h1>
          <p className="mt-3 max-w-[22rem] text-[12px] leading-relaxed uppercase tracking-wider text-bg-ivory/75">
            {t("hero.subtitle")}
          </p>
        </div>
      </div>

      {/* CTA strip under image — sits on solid bg-deep */}
      <div className="flex w-full items-center justify-center gap-2 px-5 pt-4 pb-7">
        <Button asChild variant="pill-accent" size="lg" className="flex-1 max-w-[180px]">
          <Link to="/booking">{t("btn.book_now")}</Link>
        </Button>
        <Button asChild variant="pill-outline" size="lg" className="flex-1 max-w-[180px]">
          <Link to="/services">{t("nav.services")}</Link>
        </Button>
      </div>
    </section>
  );
}
