import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function LoyaltyBanner() {
  return (
    <section className="px-5">
      <Link
        to="/profile"
        className="relative block overflow-hidden rounded-[24px] bg-bg-primary text-bg-ivory p-5 ring-1 ring-accent/25 shadow-warm-sm active:scale-[0.99] transition-transform"
      >
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1 barber-stripe"
        />
        <div className="relative flex items-start gap-3 pl-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-foreground text-[18px]">
            💈
          </div>
          <div className="flex-1">
            <span className="caption text-accent">Bravo Club</span>
            <h3 className="mt-1 text-[18px] font-bold leading-tight">
              Кешбэк до <span className="font-serif-italic text-accent">15%</span> бонусами
            </h3>
            <p className="mt-1 text-[13px] text-bg-ivory/65">
              Чем больше визитов — тем выше уровень и кешбэк.
            </p>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 text-bg-ivory/50" aria-hidden="true" />
        </div>
      </Link>
    </section>
  );
}
