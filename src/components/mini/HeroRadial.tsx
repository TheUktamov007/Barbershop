import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useT } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

const heroImg = "/assets/hero-hands.jpg";

export function HeroRadial() {
  const t = useT();
  const [lang] = useLang();
  return (
    <section className="relative overflow-hidden gradient-hero rounded-b-[36px] px-5 pt-10 pb-12 text-bg-ivory">
      {/* barbershop pole stripe accent at top */}
      <div className="absolute inset-x-0 top-0 h-1 barber-stripe opacity-80" aria-hidden />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 30%, oklch(0.74 0.14 55 / 0.45), transparent 60%)",
          filter: "blur(24px)",
        }}
      />

      <header className="relative flex items-center justify-between">
        <span className="caption text-accent">✂ BRAVO · Barbershop</span>
        <span className="caption text-bg-ivory/55">{lang.toUpperCase()}</span>
      </header>

      <div className="relative mt-10 flex flex-col items-center text-center">
        <span className="caption text-bg-ivory/60">{t("hero.network")}</span>
        <h1 className="mt-3 text-[42px] leading-[0.95] font-extrabold uppercase tracking-tight">
          {t("hero.title.a")}
          <br />
          {t("hero.title.b")}{" "}
          <span className="font-serif-italic normal-case text-accent">{t("hero.title.italic")}</span>{" "}
          {t("hero.title.c")}
        </h1>
        <p className="mt-4 max-w-[20rem] text-[14px] leading-relaxed text-bg-ivory/70">
          {t("hero.subtitle")}
        </p>

        <div className="mt-7 flex w-full max-w-xs items-center justify-center gap-2">
          <Button asChild variant="pill-accent" size="lg" className="flex-1">
            <Link to="/booking">{t("btn.book_now")}</Link>
          </Button>
          <Button asChild variant="pill-outline" size="lg" className="flex-1">
            <Link to="/services">{t("nav.services")}</Link>
          </Button>
        </div>

        <div className="relative mt-10 w-full max-w-sm">
          <div className="absolute inset-x-6 top-4 -z-0 h-48 rounded-[40px] bg-accent/25 blur-3xl" />
          <img
            src={heroImg}
            alt="Bravo Barbershop"
            width={1024}
            height={1280}
            className="relative z-10 mx-auto aspect-[4/5] w-full rounded-[28px] object-cover shadow-warm-lg ring-1 ring-accent/20"
          />
        </div>
      </div>
    </section>
  );
}
