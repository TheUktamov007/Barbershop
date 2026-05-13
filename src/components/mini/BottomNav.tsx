import { Link, useLocation } from "@tanstack/react-router";
import { Home, Scissors, CalendarDays, User, MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";
import { isInTelegram } from "@/lib/bookings-client";

export function BottomNav() {
  const { pathname } = useLocation();
  const t = useT();
  const inTg = isInTelegram();
  const items = inTg
    ? ([
        { to: "/", label: t("nav.home"), icon: Home },
        { to: "/services", label: t("nav.services"), icon: Scissors },
        { to: "/booking", label: t("nav.booking"), icon: CalendarDays },
        { to: "/profile", label: t("nav.profile"), icon: User },
      ] as const)
    : ([
        { to: "/", label: t("nav.home"), icon: Home },
        { to: "/services", label: t("nav.services"), icon: Scissors },
        { to: "/booking", label: t("nav.booking"), icon: CalendarDays },
        { to: "/branches", label: "Филиалы", icon: MapPin },
      ] as const);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom px-3 pt-2">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-pill bg-bg-deep/85 backdrop-blur-xl border border-bg-ivory/10 px-3 py-2 shadow-warm-lg">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-pill py-2 text-[11px] font-medium transition-all ${
                active
                  ? "bg-bg-ivory text-bg-deep"
                  : "text-bg-ivory/70 hover:text-bg-ivory"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
