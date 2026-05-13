import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/mini/BottomNav";
import { myPromoCodes, formatSum } from "@/lib/mock";
import {
  useMyBookings,
  useCancelBooking,
  type ClientBooking,
} from "@/lib/bookings-client";
import {
  useMyLoyalty,
  useSetMyBirthday,
} from "@/lib/loyalty-client";
import { useCreateReview } from "@/lib/reviews-client";
import { useMyReferral } from "@/lib/batch2-client";
import { useMyCerts, useMyPackages } from "@/lib/batch4-client";
import {
  usePushStatus,
  useSubscribePush,
  useUnsubscribePush,
  useVapidKey,
} from "@/lib/push-client";
import {
  useTelegramAuth,
  getTelegramWebApp,
  haptic,
} from "@/lib/telegram-client";
import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Sparkle,
  Settings,
  Gift,
  Heart,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  CalendarDays,
  Ticket,
  Check,
  Globe,
  LogOut,
  Users,
  Copy,
  MessageCircle,
  Cake,
  Bell,
  History,
  Medal,
  Trophy,
  Crown,
  Gem,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Профиль — Bravo" },
      { name: "description", content: "Личный кабинет, бонусы, мои записи." },
    ],
  }),
  component: ProfilePage,
});

import { useLang, type Lang } from "@/lib/lang";

function ProfilePage() {
  const { data: myBookings, isLoading: bookingsLoading } = useMyBookings();
  const { data: loyalty } = useMyLoyalty();
  const { data: myCerts } = useMyCerts();
  const { data: myPkgs } = useMyPackages();
  const { result: tg } = useTelegramAuth();
  const [unsafeUser, setUnsafeUser] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soonOpen, setSoonOpen] = useState<"certificates" | "favorites" | null>(null);
  const [clubOpen, setClubOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  useEffect(() => {
    const u = getTelegramWebApp()?.initDataUnsafe?.user;
    if (u) setUnsafeUser(u);
  }, []);
  const tgUser = tg?.user ?? unsafeUser ?? null;

  const upcoming = myBookings.filter(
    (b) => b.status === "upcoming" || b.status === "confirmed",
  );
  const history = myBookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled",
  );
  const displayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username || "Гость"
    : "Гость";
  const initials = (displayName.match(/\p{L}/u)?.[0] || "?").toUpperCase();
  const tgPhoto = tgUser?.photo_url;

  return (
    <main className="mx-auto min-h-screen max-w-md bg-bg-deep pb-28 text-bg-ivory">
      {/* header */}
      <section className="relative gradient-hero rounded-b-[40px] px-5 pt-12 pb-7">
        <div className="flex items-center justify-between">
          <span className="caption text-bg-ivory/70">Личный кабинет</span>
          <button
            onClick={() => {
              haptic("light");
              setSettingsOpen(true);
            }}
            aria-label="Настройки"
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 transition-colors"
          >
            <Settings className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {tgPhoto ? (
            <img
              src={tgPhoto}
              alt={displayName}
              loading="lazy"
              className="h-14 w-14 rounded-pill object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-pill bg-accent text-[20px] font-bold text-accent-foreground">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-[22px] font-bold leading-tight">{displayName}</h1>
            <p className="text-[12px] text-bg-ivory/60">
              {tgUser?.username ? `@${tgUser.username}` : "Войдите через Telegram"}
            </p>
          </div>
        </div>

        {/* loyalty card — real data from D1 */}
        <LoyaltyCard view={loyalty} />
      </section>

      {/* upcoming */}
      <section className="mt-7 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-bold">
            Предстоящие <span className="font-serif-italic text-accent">записи</span>
          </h2>
          <span className="caption text-bg-ivory/50">{upcoming.length}</span>
        </div>

        <div className="mt-3 space-y-2">
          {bookingsLoading ? (
            <div className="rounded-[20px] bg-bg-ivory/5 p-4 text-[13px] text-bg-ivory/50">
              Загружаем…
            </div>
          ) : upcoming.length === 0 ? (
            <Link
              to="/booking"
              className="flex items-center gap-3 rounded-[20px] bg-bg-ivory/5 p-4 text-bg-ivory/70"
            >
              <CalendarDays className="h-5 w-5 text-accent" />
              Записей пока нет — самое время записаться
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          ) : (
            upcoming.map((b) => <BookingCard key={b.id} b={b} />)
          )}
        </div>
      </section>

      {/* quick links — each opens a contextual sheet */}
      <section className="mt-7 grid grid-cols-2 gap-3 px-5">
        <QuickActionButton
          icon={<Users />}
          label="Пригласить друга"
          sub="+50 000 бонусов"
          onOpen={() => setRefOpen(true)}
        />
        <QuickActionButton
          icon={<CalendarDays />}
          label="Мой календарь"
          sub="все визиты"
          onOpen={() => setCalOpen(true)}
        />
        <QuickActionLink
          icon={<Gift />}
          label="Промокоды"
          sub={`${myPromoCodes.length} активных`}
          to="/promos"
        />
        <QuickActionButton
          icon={<Sparkle />}
          label="Bravo Club"
          sub="Привилегии"
          onOpen={() => setClubOpen(true)}
        />
      </section>

      {/* contact salon */}
      <section className="mt-4 px-5">
        <a
          href="https://t.me/bravobarber_bot"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => haptic("light")}
          className="flex items-center gap-3 rounded-[20px] bg-bg-ivory/5 p-4 active:bg-bg-ivory/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent/15 text-accent">
            <MessageCircle className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold">Написать в Bravo</p>
            <p className="text-[11px] text-bg-ivory/60">
              Вопросы, переносы, пожелания
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-bg-ivory/40" aria-hidden="true" />
        </a>
      </section>

      {/* certificates */}
      {(myCerts ?? []).length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="text-[18px] font-bold">
            Мои <span className="font-serif-italic text-accent">ваучеры</span>
          </h2>
          <div className="mt-3 space-y-2">
            {(myCerts ?? []).map((c) => (
              <div
                key={c.id}
                className="rounded-[20px] glass-card p-4 flex items-center gap-3"
              >
                <Gift className="h-6 w-6 text-accent" strokeWidth={1.7} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold">
                    {c.amountBalance.toLocaleString("ru-RU")} сум
                  </p>
                  <p className="text-[11px] text-bg-ivory/60">
                    Код:{" "}
                    <span className="font-mono text-accent">{c.code}</span>
                    {c.expiresAt && ` · до ${c.expiresAt}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* packages */}
      {(myPkgs ?? []).length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="text-[18px] font-bold">
            Мои <span className="font-serif-italic text-accent">абонементы</span>
          </h2>
          <div className="mt-3 space-y-2">
            {(myPkgs ?? []).map((p) => {
              const left = p.totalVisits - p.usedVisits;
              const pct = Math.round((p.usedVisits / p.totalVisits) * 100);
              return (
                <div key={p.id} className="rounded-[20px] glass-card p-4">
                  <div className="flex items-center gap-3">
                    <Ticket className="h-6 w-6 text-accent" strokeWidth={1.7} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate">{p.title}</p>
                      <p className="text-[11px] text-bg-ivory/60">
                        Осталось {left} из {p.totalVisits}
                        {p.expiresAt && ` · до ${p.expiresAt}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-bg-ivory/10 overflow-hidden">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* promo codes */}
      <section className="mt-7 px-5">
        <h2 className="text-[18px] font-bold">Мои промокоды</h2>
        <p className="mt-1 text-[12px] text-bg-ivory/50">
          Тап на код → скопировать. «Применить» → откроется бронирование, код подставится автоматически.
        </p>
        <div className="mt-3 space-y-2">
          {myPromoCodes.map((p) => (
            <div
              key={p.code}
              className="rounded-[20px] glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-accent" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{p.title}</p>
                  <p className="text-[12px] text-bg-ivory/60">{p.expires}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    haptic("light");
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(p.code).catch(() => {});
                    }
                    const tg = getTelegramWebApp() as unknown as {
                      showAlert?: (m: string) => void;
                    };
                    if (tg?.showAlert) tg.showAlert(`Код ${p.code} скопирован`);
                  }}
                  className="rounded-pill bg-accent/15 px-3 py-1 text-[11px] font-bold tracking-widest text-accent active:bg-accent/25"
                >
                  {p.code}
                </button>
              </div>
              <Link
                to="/booking"
                search={{ promo_code: p.code, step: 1 as const }}
                onClick={() => haptic("success")}
                className="mt-3 block w-full rounded-pill bg-accent px-3 py-2 text-center text-[12px] font-semibold text-accent-foreground active:opacity-90"
              >
                Применить при бронировании →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* history → opens drawer */}
      {history.length > 0 && (
        <section className="mt-7 px-5">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setHistoryOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-[20px] bg-bg-ivory/5 p-4 active:bg-bg-ivory/10 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-bg-ivory/10 text-bg-ivory/70">
              <History className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-semibold">История визитов</p>
              <p className="text-[11px] text-bg-ivory/60">
                {history.length} {history.length === 1 ? "запись" : history.length < 5 ? "записи" : "записей"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-bg-ivory/40" aria-hidden="true" />
          </button>
        </section>
      )}

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <SoonDrawer kind={soonOpen} onClose={() => setSoonOpen(null)} />
      <ClubDrawer open={clubOpen} onClose={() => setClubOpen(false)} loyalty={loyalty} />
      <ReferralDrawer open={refOpen} onClose={() => setRefOpen(false)} />
      <CalendarDrawer
        open={calOpen}
        onClose={() => setCalOpen(false)}
        bookings={myBookings}
      />
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
      />
      <BottomNav />
    </main>
  );
}

function BookingCard({ b }: { b: ClientBooking }) {
  const cancelMut = useCancelBooking();
  const tgShareUrl = (() => {
    const dateLabel = new Date(b.startAt).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });
    const time = b.startAt.slice(11, 16);
    const text = `Я записался в Bravo Barbershop ✂️\n${b.serviceTitle}\n${dateLabel} в ${time}\n${b.branchName}`;
    const url = "https://t.me/bravobarber_bot";
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  })();
  const repeatSearch = b.serviceIds && b.serviceIds.length > 0
    ? { services: b.serviceIds.join(","), branch: b.branchId, master: b.masterId, step: 4 }
    : { branch: b.branchId, master: b.masterId, step: 1 };
  // Use UTC to avoid SSR/client timezone mismatch (hydration error)
  const date = new Date(b.startAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const time = new Date(b.startAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const statusColor =
    b.status === "upcoming" || b.status === "confirmed"
      ? "bg-accent text-accent-foreground"
      : b.status === "completed"
        ? "bg-bg-ivory/15 text-bg-ivory/70"
        : "bg-destructive/20 text-destructive";

  const statusLabel =
    b.status === "upcoming"
      ? "Скоро"
      : b.status === "confirmed"
        ? "Подтверждено"
        : b.status === "completed"
          ? "Прошло"
          : "Отмена";

  const canCancel = b.status === "upcoming" || b.status === "confirmed";

  const onCancel = () => {
    haptic("warning");
    const tg = getTelegramWebApp() as unknown as {
      showConfirm?: (msg: string, cb: (ok: boolean) => void) => void;
    };
    const doIt = () => {
      cancelMut.mutate(b.id);
    };
    if (tg?.showConfirm) {
      tg.showConfirm("Отменить запись?", (ok) => {
        if (ok) doIt();
      });
    } else if (typeof window !== "undefined" && window.confirm("Отменить запись?")) {
      doIt();
    }
  };

  return (
    <div className="rounded-[20px] glass-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold leading-tight">
            {b.serviceTitle}
          </p>
          <p className="mt-1 text-[12px] text-bg-ivory/60">
            {b.masterName} · {b.branchName}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-pill px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="text-bg-ivory/70">
          {date} · {time}
        </span>
        <span className="font-semibold text-accent">{formatSum(b.price)}</span>
      </div>
      {canCancel && (
        <div className="mt-3 flex gap-2">
          <a
            href={tgShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => haptic("light")}
            className="flex-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-center text-[12px] font-medium text-bg-ivory active:bg-bg-ivory/15"
            title="Поделиться в Telegram"
          >
            ↗ Поделиться
          </a>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelMut.isPending}
            className="flex-1 rounded-pill bg-destructive/15 px-3 py-2 text-[12px] font-medium text-destructive active:bg-destructive/25 disabled:opacity-50"
          >
            {cancelMut.isPending ? "..." : "Отменить"}
          </button>
        </div>
      )}
      {b.status === "completed" && (
        <>
          <Link
            to="/booking"
            search={repeatSearch}
            onClick={() => haptic("light")}
            className="mt-3 block rounded-pill bg-accent/10 px-3 py-2 text-center text-[12px] font-medium text-accent active:bg-accent/20"
          >
            ↻ Повторить запись
          </Link>
          <ReviewBlock booking={b} />
        </>
      )}
    </div>
  );
}

function ReviewBlock({ booking }: { booking: ClientBooking }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const createMut = useCreateReview();

  if (createMut.isSuccess) {
    return (
      <div className="mt-3 rounded-pill bg-accent/15 px-3 py-2 text-center text-[12px] font-medium text-accent">
        Спасибо за отзыв ✨
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          haptic("light");
          setOpen(true);
        }}
        className="mt-3 w-full rounded-pill bg-accent/10 px-3 py-2 text-[12px] font-medium text-accent active:bg-accent/20"
      >
        ★ Оставить отзыв
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-[16px] bg-bg-ivory/5 p-3 space-y-2">
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              haptic("select");
              setRating(n);
            }}
            className="text-[28px] leading-none transition-transform active:scale-110"
            aria-label={`${n} звёзд`}
          >
            <span className={n <= rating ? "text-accent" : "text-bg-ivory/20"}>
              ★
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Расскажите о визите…"
        rows={3}
        className="w-full rounded-[16px] bg-bg-ivory/5 px-3 py-2 text-[13px] text-bg-ivory outline-none placeholder:text-bg-ivory/40 focus:bg-bg-ivory/10"
        maxLength={1000}
      />
      {createMut.isError ||
      (createMut.data && !createMut.data.ok && createMut.data.error) ? (
        <p className="text-[11px] text-red-400">
          {createMut.data?.error ?? "Не удалось отправить отзыв"}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-[12px] font-medium text-bg-ivory active:bg-bg-ivory/15"
        >
          Отмена
        </button>
        <button
          type="button"
          onClick={() => {
            haptic("success");
            createMut.mutate({
              bookingId: booking.id,
              rating,
              text: text.trim() || undefined,
            });
          }}
          disabled={createMut.isPending}
          className="flex-1 rounded-pill bg-accent px-3 py-2 text-[12px] font-medium text-accent-foreground active:opacity-90 disabled:opacity-50"
        >
          {createMut.isPending ? "..." : "Отправить"}
        </button>
      </div>
    </div>
  );
}

function LoyaltyCard({ view }: { view: import("@/lib/loyalty-client").LoyaltyView | null }) {
  // While loading, show a polished placeholder rather than blank zeros.
  if (!view) {
    return (
      <div className="relative mt-5 overflow-hidden rounded-[24px] bg-bg-ivory/95 text-bg-deep p-4">
        <div className="h-5 w-24 rounded bg-bg-deep/10 animate-pulse" />
        <div className="mt-2 h-7 w-40 rounded bg-bg-deep/10 animate-pulse" />
        <div className="mt-3 h-1.5 rounded bg-bg-deep/10 animate-pulse" />
      </div>
    );
  }

  const points = view.profile?.bonusPoints ?? 0;
  const visits = view.profile?.visitsCount ?? 0;
  const tierLabel = view.tierLabel;
  const cashback = view.cashbackPct;

  // Progress to next tier (visit-based). If at platinum, fill to 100%.
  const upper = view.nextTier
    ? visits + Math.max(0, view.visitsToNextTier)
    : visits;
  const pct = upper > 0 ? Math.min(100, Math.round((visits / upper) * 100)) : 100;

  return (
    <div className="relative mt-5 overflow-hidden rounded-[24px] bg-bg-ivory text-bg-deep p-4">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/40 blur-3xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <span className="caption text-accent-dark">Уровень {tierLabel}</span>
          <p className="mt-1 text-[28px] font-bold leading-none">
            {points.toLocaleString("ru-RU")}{" "}
            <span className="text-base font-medium">бонусов</span>
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Кешбэк <span className="font-semibold">{cashback}%</span>
            {view.nextTier
              ? ` · до ${view.nextTierLabel} осталось ${view.visitsToNextTier} визит${view.visitsToNextTier === 1 ? "" : "ов"}`
              : " · максимальный уровень"}
          </p>
        </div>
        <Sparkle className="h-6 w-6 text-accent" strokeWidth={1.6} aria-hidden="true" />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-light">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Визитов: <b>{visits}</b> · Потрачено:{" "}
        <b>{(view.profile?.totalSpent ?? 0).toLocaleString("ru-RU")} сум</b>
      </p>
    </div>
  );
}

function QuickActionLink({
  icon,
  label,
  sub,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  to: "/promos" | "/services" | "/booking" | "/branches" | "/profile";
}) {
  return (
    <Link
      to={to}
      onClick={() => haptic("light")}
      className="flex items-start gap-3 rounded-[20px] bg-bg-ivory/5 p-4 text-left active:bg-bg-ivory/10 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent/15 text-accent [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold">{label}</p>
        <p className="text-[11px] text-bg-ivory/60">{sub}</p>
      </div>
    </Link>
  );
}

function QuickActionButton({
  icon,
  label,
  sub,
  onOpen,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("light");
        onOpen();
      }}
      className="flex items-start gap-3 rounded-[20px] bg-bg-ivory/5 p-4 text-left active:bg-bg-ivory/10 transition-colors"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent/15 text-accent [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>
      <div>
        <p className="text-[14px] font-semibold">{label}</p>
        <p className="text-[11px] text-bg-ivory/60">{sub}</p>
      </div>
    </button>
  );
}

function SoonDrawer({
  kind,
  onClose,
}: {
  kind: "certificates" | "favorites" | null;
  onClose: () => void;
}) {
  const open = kind !== null;
  const content = {
    certificates: {
      title: "Ваучеры",
      desc: "Подарочный ваучер для друга или родных.",
      body: "Готовим запуск подарочных ваучеров: можно будет купить ваучер на любую сумму и подарить через Telegram. Ждём вас в обновлении 💛",
    },
    favorites: {
      title: "Любимые мастера",
      desc: "Быстрый доступ к избранным.",
      body: "Скоро добавим возможность сохранять любимых мастеров в избранное — записывайтесь к ним в один тап. Сейчас выберите мастера на странице услуги.",
    },
  }[kind ?? "certificates"];
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">{content.title}</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            {content.desc}
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="rounded-[20px] bg-bg-ivory/5 p-4">
            <span className="caption text-accent">Скоро</span>
            <p className="mt-2 text-[14px] text-bg-ivory/80">{content.body}</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ClubDrawer({
  open,
  onClose,
  loyalty,
}: {
  open: boolean;
  onClose: () => void;
  loyalty: import("@/lib/loyalty-client").LoyaltyView | null;
}) {
  const tier = loyalty?.tierLabel ?? "Bronze";
  const cashback = loyalty?.cashbackPct ?? 5;
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">Bravo Club</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            Программа лояльности.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          <div className="rounded-[20px] bg-accent/15 p-4 border border-accent/20">
            <span className="caption text-accent">Ваш уровень</span>
            <p className="mt-1 text-[24px] font-bold text-bg-ivory">{tier}</p>
            <p className="mt-1 text-[13px] text-bg-ivory/70">
              Кешбэк {cashback}% с каждого завершённого визита.
            </p>
          </div>
          <div className="rounded-[20px] bg-bg-ivory/5 p-4 space-y-2 text-[13px]">
            <p className="font-semibold mb-1">Как работают уровни</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Medal className="h-4 w-4 text-[#cd7f32]" strokeWidth={1.8} /><b>Bronze</b> — 5% кешбэк (новый клиент)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Medal className="h-4 w-4 text-bg-ivory/70" strokeWidth={1.8} /><b>Silver</b> — 8% (после 3 визитов)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Trophy className="h-4 w-4 text-accent" strokeWidth={1.8} /><b>Gold</b> — 12% (после 10 визитов)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Gem className="h-4 w-4 text-cyan-300" strokeWidth={1.8} /><b>Platinum</b> — 15% (после 25 визитов)</p>
          </div>
          <div className="rounded-[20px] bg-bg-ivory/5 p-4 text-[13px] text-bg-ivory/80">
            <p className="font-semibold mb-1">Как использовать бонусы</p>
            <p>На шаге подтверждения записи включите тумблер «Использовать бонусы» — оплатите до 50% стоимости накопленными баллами.</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SettingsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [lang, setLangState] = useLang();
  const { data: loyalty } = useMyLoyalty();
  const setBirthdayMut = useSetMyBirthday();
  const [bd, setBd] = useState<string>("");
  useEffect(() => {
    setBd(loyalty?.profile?.birthday ?? "");
  }, [loyalty?.profile?.birthday]);

  // Web push.
  const [pushStatus, setPushStatus] = usePushStatus();
  const { data: vapidData } = useVapidKey();
  const subscribePush = useSubscribePush();
  const unsubscribePush = useUnsubscribePush();
  const togglePush = async () => {
    haptic("light");
    if (pushStatus.subscribed) {
      await unsubscribePush.mutateAsync();
      setPushStatus((s) => ({ ...s, subscribed: false }));
    } else if (vapidData?.ok && vapidData.key) {
      const r = await subscribePush.mutateAsync(vapidData.key);
      if (r.ok) setPushStatus((s) => ({ ...s, subscribed: true, permission: "granted" }));
    }
  };

  const choose = (l: Lang) => {
    haptic("select");
    setLangState(l);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic("light");
                onClose();
              }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <div className="flex-1">
              <DrawerTitle className="text-bg-ivory">Настройки</DrawerTitle>
              <DrawerDescription className="text-bg-ivory/60">
                Язык интерфейса и параметры аккаунта.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="rounded-[20px] bg-bg-ivory/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                Язык
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { code: "ru" as const, label: "Русский" },
                { code: "uz" as const, label: "Oʻzbekcha" },
              ]).map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => choose(opt.code)}
                  className={`flex items-center justify-between rounded-pill px-4 py-3 text-[14px] font-medium transition-all ${
                    lang === opt.code
                      ? "bg-accent text-accent-foreground"
                      : "bg-bg-ivory/10 text-bg-ivory"
                  }`}
                >
                  <span>{opt.label}</span>
                  {lang === opt.code && (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-bg-ivory/50">
              Полный перевод интерфейса добавим в следующем обновлении.
            </p>
          </div>

          <div className="rounded-[20px] bg-bg-ivory/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4 text-accent" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                День рождения
              </span>
            </div>
            <p className="text-[12px] text-bg-ivory/60 mb-2">
              В свой день рождения получите скидку 25% на любую услугу.
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={bd}
                onChange={(e) => setBd(e.target.value)}
                className="flex-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-[14px] text-bg-ivory outline-none focus:bg-bg-ivory/15"
              />
              <button
                type="button"
                disabled={setBirthdayMut.isPending}
                onClick={() => {
                  haptic("success");
                  setBirthdayMut.mutate(bd || null);
                }}
                className="rounded-pill bg-accent px-4 py-2 text-[14px] font-medium text-accent-foreground active:opacity-90 disabled:opacity-50"
              >
                {setBirthdayMut.isPending ? "..." : "Сохранить"}
              </button>
            </div>
            {setBirthdayMut.isSuccess && (
              <p className="mt-2 text-[11px] text-accent">Сохранено ✓</p>
            )}
          </div>

          {/* Push notifications */}
          {pushStatus.supported && vapidData?.ok && (
            <div className="rounded-[20px] bg-bg-ivory/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                  Push-уведомления
                </span>
              </div>
              <p className="text-[12px] text-bg-ivory/60 mb-3">
                Напоминания и подтверждения будут приходить как обычные уведомления телефона.
              </p>
              <button
                type="button"
                onClick={togglePush}
                disabled={subscribePush.isPending || unsubscribePush.isPending}
                className={`w-full rounded-pill px-4 py-2.5 text-[14px] font-medium disabled:opacity-50 ${
                  pushStatus.subscribed
                    ? "bg-bg-ivory/10 text-bg-ivory"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {subscribePush.isPending || unsubscribePush.isPending
                  ? "..."
                  : pushStatus.subscribed
                    ? "Отключить push"
                    : "Включить push"}
              </button>
              {pushStatus.permission === "denied" && (
                <p className="mt-2 text-[11px] text-red-400">
                  Уведомления заблокированы в браузере. Откройте настройки сайта.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              haptic("medium");
              const tg = getTelegramWebApp() as unknown as { close?: () => void };
              tg?.close?.();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-bg-ivory/10 px-4 py-3 text-[14px] font-medium active:bg-bg-ivory/15"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Закрыть Mini App
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function ReferralDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: ref } = useMyReferral();
  const [copied, setCopied] = useState(false);
  const inviteUrl = ref?.inviteUrl ?? "";
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    inviteUrl,
  )}&text=${encodeURIComponent(
    "Записывайся со мной в Bravo Barbershop ✂️ Получишь 50 000 бонусов при первой записи через эту ссылку:",
  )}`;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">Пригласи друга</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            Когда друг откроет Bravo по твоей ссылке и запишется — оба получите по 50 000 бонусов.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-bg-ivory/5 p-3">
              <p className="text-[10px] uppercase text-bg-ivory/50">Приглашено</p>
              <p className="mt-1 text-[20px] font-bold text-bg-ivory">
                {ref?.invitedCount ?? 0}
              </p>
            </div>
            <div className="rounded-[14px] bg-bg-ivory/5 p-3">
              <p className="text-[10px] uppercase text-bg-ivory/50">Заработано бонусов</p>
              <p className="mt-1 text-[20px] font-bold text-accent">
                {ref?.bonusEarned ?? 0}
              </p>
            </div>
          </div>

          {inviteUrl && (
            <div className="rounded-[16px] bg-bg-ivory/5 p-3">
              <p className="text-[11px] uppercase text-bg-ivory/50 mb-1">Ваша ссылка</p>
              <p className="break-all text-[12px] font-mono text-bg-ivory/90">{inviteUrl}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    haptic("light");
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(inviteUrl).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-[13px] font-medium text-bg-ivory active:bg-bg-ivory/15"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? "Скопировано" : "Скопировать"}
                </button>
                <a
                  href={tgShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => haptic("success")}
                  className="flex-1 rounded-pill bg-accent px-3 py-2 text-center text-[13px] font-medium text-accent-foreground active:opacity-90"
                >
                  Отправить в TG
                </a>
              </div>
            </div>
          )}

          <div className="rounded-[16px] bg-bg-ivory/5 p-3 text-[12px] text-bg-ivory/70">
            <p className="font-semibold mb-1 text-bg-ivory">Как это работает</p>
            <p>1. Скопируй или отправь ссылку другу</p>
            <p>2. Он откроет Bravo по ссылке и сделает первую запись</p>
            <p>3. После завершения визита вы оба получите 50 000 бонусов</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CalendarDrawer({
  open,
  onClose,
  bookings,
}: {
  open: boolean;
  onClose: () => void;
  bookings: ClientBooking[];
}) {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  // First day of month, starting Monday = 0.
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const bookingsByDay = new Map<string, ClientBooking[]>();
  bookings.forEach((b) => {
    const d = b.startAt.slice(0, 10);
    const arr = bookingsByDay.get(d) ?? [];
    arr.push(b);
    bookingsByDay.set(d, arr);
  });

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = monthDate.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

  const shift = (delta: number) => {
    haptic("select");
    setMonthDate(new Date(year, month + delta, 1));
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">Мой календарь визитов</DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/15"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[15px] font-semibold capitalize">{monthName}</p>
            <button
              type="button"
              onClick={() => shift(1)}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/15"
              aria-label="Следующий месяц"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-bg-ivory/50 mb-1">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (d === null) return <div key={i} />;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const items = bookingsByDay.get(key) ?? [];
              const isToday = key === todayKey;
              const hasActive = items.some((b) => b.status === "upcoming" || b.status === "confirmed");
              const hasDone = items.some((b) => b.status === "completed");
              return (
                <div
                  key={i}
                  className={`aspect-square flex flex-col items-center justify-center rounded-[10px] text-[12px] ${
                    isToday ? "ring-1 ring-accent" : ""
                  } ${
                    items.length > 0 ? "bg-bg-ivory/10" : "bg-transparent"
                  }`}
                >
                  <span className="font-semibold">{d}</span>
                  {items.length > 0 && (
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        hasActive ? "bg-accent" : hasDone ? "bg-emerald-400" : "bg-bg-ivory/40"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 text-[11px] text-bg-ivory/60">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-accent" /> Активные
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Прошедшие
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-bg-ivory/40" /> Отменённые
            </span>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}


function HistoryDrawer({
  open,
  onClose,
  history,
}: {
  open: boolean;
  onClose: () => void;
  history: ClientBooking[];
}) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory max-h-[85vh]">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="Назад"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">История визитов</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            Все ваши прошедшие и отменённые записи.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {history.length === 0 ? (
            <p className="text-center text-[13px] text-bg-ivory/50 py-8">
              История пуста.
            </p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {history.map((b) => (
                <BookingCard key={b.id} b={b} />
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
