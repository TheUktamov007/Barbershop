import { Link, useLocation } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isInTelegram } from "@/lib/bookings-client";
import { Button } from "@/components/ui/button";

/**
 * Desktop top navigation bar. Hidden on mobile (md+).
 * Renders only outside Telegram WebApp (Mini App keeps mobile-only chrome).
 */
export function TopNav() {
  const { pathname } = useLocation();
  const t = useT();
  const inTg = isInTelegram();
  // Inside the Telegram Mini App we don't show the desktop nav — TG already
  // provides its own header.
  if (inTg) return null;

  const items = [
    { to: "/", label: t("nav.home") },
    { to: "/services", label: t("nav.services") },
    { to: "/branches", label: "Филиалы" },
    { to: "/promos", label: "Акции" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-bg-ivory/10 bg-bg-deep/85 backdrop-blur-xl md:block">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Scissors className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <span className="text-[18px] font-extrabold tracking-tight uppercase text-bg-ivory">
            Bravo <span className="text-accent">Barbershop</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {items.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`rounded-pill px-4 py-2 text-[14px] font-semibold transition-colors ${
                  active
                    ? "bg-bg-ivory/10 text-bg-ivory"
                    : "text-bg-ivory/70 hover:bg-bg-ivory/5 hover:text-bg-ivory"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Button asChild variant="pill-accent" size="default">
          <Link to="/booking">{t("btn.book_now")}</Link>
        </Button>
      </div>
    </header>
  );
}
