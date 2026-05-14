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
      {/* Mobile layout — image with overlay text (md:hidden) */}
      <div className="md:hidden">
        <div className="relative aspect-[3/4] w-full">
          <img
            src={bannerImg}
            alt="Bravo Barbershop"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.13 0 0 / 0.25) 0%, transparent 25%, transparent 50%, oklch(0.13 0 0 / 0.8) 75%, oklch(0.13 0 0) 100%)",
            }}
          />
          <header className="absolute inset-x-0 top-0 flex items-center justify-between px-5 pt-7">
            <span className="caption inline-flex items-center gap-1.5 text-accent">
              <Scissors className="h-3.5 w-3.5" strokeWidth={2} />
              BRAVO · BARBERSHOP
            </span>
            <span className="caption text-bg-ivory/70">{lang.toUpperCase()}</span>
          </header>

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

        <div className="flex w-full items-center justify-center gap-2 px-5 pt-4 pb-7">
          <Button asChild variant="pill-accent" size="lg" className="flex-1 max-w-[180px]">
            <Link to="/booking">{t("btn.book_now")}</Link>
          </Button>
          <Button asChild variant="pill-outline" size="lg" className="flex-1 max-w-[180px]">
            <Link to="/services">{t("nav.services")}</Link>
          </Button>
        </div>
      </div>

      {/* Desktop layout — split text | image (hidden on mobile) */}
      <div className="relative hidden md:block">
        {/* Subtle accent glow background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 0% 50%, oklch(0.90 0.18 100 / 0.18), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 items-center gap-10 px-8 py-16">
          <div className="text-left">
            <span className="caption inline-flex items-center gap-1.5 text-accent">
              <Scissors className="h-4 w-4" strokeWidth={2} />
              BRAVO · BARBERSHOP
            </span>
            <p className="mt-6 caption text-bg-ivory/70">{t("hero.network")}</p>
            <h1 className="mt-3 text-[72px] leading-[0.92] font-extrabold uppercase tracking-tight">
              {t("hero.title.a")}
              <br />
              {t("hero.title.b")}{" "}
              <span className="font-serif-italic normal-case text-accent">
                {t("hero.title.italic")}
              </span>{" "}
              {t("hero.title.c")}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-bg-ivory/75">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Button asChild variant="pill-accent" size="lg">
                <Link to="/booking">{t("btn.book_now")}</Link>
              </Button>
              <Button asChild variant="pill-outline" size="lg">
                <Link to="/services">{t("nav.services")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 rounded-[40px] bg-accent/15 blur-3xl"
            />
            <img
              src={bannerImg}
              alt="Bravo Barbershop"
              fetchPriority="high"
              className="aspect-[3/4] w-full rounded-[28px] object-cover ring-1 ring-accent/20 shadow-warm-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
