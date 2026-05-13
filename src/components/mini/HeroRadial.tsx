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
      {/* Banner image — taller so the face stays visible above the text */}
      <div className="relative aspect-[3/5] w-full">
        <img
          src={bannerImg}
          alt="Bravo Barbershop"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* Bottom-only dark gradient so face stays clean, text gets contrast */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, transparent 45%, oklch(0.13 0 0 / 0.55) 65%, oklch(0.13 0 0) 100%)",
          }}
        />

        <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-8">
          <span className="caption inline-flex items-center gap-1.5 text-accent">
            <Scissors className="h-3.5 w-3.5" strokeWidth={2} />
            BRAVO · Barbershop
          </span>
          <span className="caption text-bg-ivory/60">{lang.toUpperCase()}</span>
        </header>
      </div>

      {/* Text block sits BELOW the image area (on solid bg-deep) */}
      <div className="flex flex-col items-center px-5 pt-2 pb-8 text-center bg-bg-deep -mt-px">
        <span className="caption text-bg-ivory/65">{t("hero.network")}</span>
        <h1 className="mt-2 text-[36px] leading-[0.98] font-extrabold uppercase tracking-tight">
          {t("hero.title.a")}
          <br />
          {t("hero.title.b")}{" "}
          <span className="font-serif-italic normal-case text-accent">
            {t("hero.title.italic")}
          </span>{" "}
          {t("hero.title.c")}
        </h1>
        <p className="mt-3 max-w-[20rem] text-[13px] leading-relaxed text-bg-ivory/70">
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
    </section>
  );
}
