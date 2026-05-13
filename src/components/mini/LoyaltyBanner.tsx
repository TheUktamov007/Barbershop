import { Link } from "@tanstack/react-router";
import { Sparkle, ChevronRight } from "lucide-react";

export function LoyaltyBanner() {
  return (
    <section className="px-5">
      <Link
        to="/profile"
        className="relative block overflow-hidden rounded-[28px] bg-bg-cream p-5 text-bg-deep shadow-warm-sm active:scale-[0.99] transition-transform"
      >
        <div
          aria-hidden
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-bg-deep text-accent">
            <Sparkle className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <span className="caption text-accent-dark">Bravo Club</span>
            <h3 className="mt-1 text-[18px] font-bold leading-tight">
              Возвращаем до <span className="font-serif-italic">15%</span> бонусами
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Чем больше визитов — тем выше уровень кешбэка.
            </p>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </Link>
    </section>
  );
}
