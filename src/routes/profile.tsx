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
      { title: "РџСЂРѕС„РёР»СЊ вЂ” Bravo" },
      { name: "description", content: "Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚, Р±РѕРЅСѓСЃС‹, РјРѕРё Р·Р°РїРёСЃРё." },
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
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username || "Р“РѕСЃС‚СЊ"
    : "Р“РѕСЃС‚СЊ";
  const initials = (displayName.match(/\p{L}/u)?.[0] || "?").toUpperCase();
  const tgPhoto = tgUser?.photo_url;

  return (
    <main className="mx-auto min-h-screen max-w-md md:max-w-5xl bg-bg-deep pb-28 text-bg-ivory">
      {/* header */}
      <section className="relative gradient-hero rounded-b-[40px] px-5 pt-12 pb-7">
        <div className="flex items-center justify-between">
          <span className="caption text-bg-ivory/70">Р›РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚</span>
          <button
            onClick={() => {
              haptic("light");
              setSettingsOpen(true);
            }}
            aria-label="РќР°СЃС‚СЂРѕР№РєРё"
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
              {tgUser?.username ? `@${tgUser.username}` : "Р’РѕР№РґРёС‚Рµ С‡РµСЂРµР· Telegram"}
            </p>
          </div>
        </div>

        {/* loyalty card вЂ” real data from D1 */}
        <LoyaltyCard view={loyalty} />
      </section>

      {/* upcoming */}
      <section className="mt-7 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[18px] font-bold">
            РџСЂРµРґСЃС‚РѕСЏС‰РёРµ <span className="font-serif-italic text-accent">Р·Р°РїРёСЃРё</span>
          </h2>
          <span className="caption text-bg-ivory/50">{upcoming.length}</span>
        </div>

        <div className="mt-3 space-y-2">
          {bookingsLoading ? (
            <div className="rounded-[20px] bg-bg-ivory/5 p-4 text-[13px] text-bg-ivory/50">
              Р—Р°РіСЂСѓР¶Р°РµРјвЂ¦
            </div>
          ) : upcoming.length === 0 ? (
            <Link
              to="/booking"
              className="flex items-center gap-3 rounded-[20px] bg-bg-ivory/5 p-4 text-bg-ivory/70"
            >
              <CalendarDays className="h-5 w-5 text-accent" />
              Р—Р°РїРёСЃРµР№ РїРѕРєР° РЅРµС‚ вЂ” СЃР°РјРѕРµ РІСЂРµРјСЏ Р·Р°РїРёСЃР°С‚СЊСЃСЏ
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          ) : (
            upcoming.map((b) => <BookingCard key={b.id} b={b} />)
          )}
        </div>
      </section>

      {/* quick links вЂ” each opens a contextual sheet */}
      <section className="mt-7 grid grid-cols-2 gap-3 px-5">
        <QuickActionButton
          icon={<Users />}
          label="РџСЂРёРіР»Р°СЃРёС‚СЊ РґСЂСѓРіР°"
          sub="+50 000 Р±РѕРЅСѓСЃРѕРІ"
          onOpen={() => setRefOpen(true)}
        />
        <QuickActionButton
          icon={<CalendarDays />}
          label="РњРѕР№ РєР°Р»РµРЅРґР°СЂСЊ"
          sub="РІСЃРµ РІРёР·РёС‚С‹"
          onOpen={() => setCalOpen(true)}
        />
        <QuickActionLink
          icon={<Gift />}
          label="РџСЂРѕРјРѕРєРѕРґС‹"
          sub={`${myPromoCodes.length} Р°РєС‚РёРІРЅС‹С…`}
          to="/promos"
        />
        <QuickActionButton
          icon={<Sparkle />}
          label="Bravo Club"
          sub="РџСЂРёРІРёР»РµРіРёРё"
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
            <p className="text-[14px] font-semibold">РќР°РїРёСЃР°С‚СЊ РІ Bravo</p>
            <p className="text-[11px] text-bg-ivory/60">
              Р’РѕРїСЂРѕСЃС‹, РїРµСЂРµРЅРѕСЃС‹, РїРѕР¶РµР»Р°РЅРёСЏ
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-bg-ivory/40" aria-hidden="true" />
        </a>
      </section>

      {/* certificates */}
      {(myCerts ?? []).length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="text-[18px] font-bold">
            РњРѕРё <span className="font-serif-italic text-accent">РІР°СѓС‡РµСЂС‹</span>
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
                    {c.amountBalance.toLocaleString("ru-RU")} СЃСѓРј
                  </p>
                  <p className="text-[11px] text-bg-ivory/60">
                    РљРѕРґ:{" "}
                    <span className="font-mono text-accent">{c.code}</span>
                    {c.expiresAt && ` В· РґРѕ ${c.expiresAt}`}
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
            РњРѕРё <span className="font-serif-italic text-accent">Р°Р±РѕРЅРµРјРµРЅС‚С‹</span>
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
                        РћСЃС‚Р°Р»РѕСЃСЊ {left} РёР· {p.totalVisits}
                        {p.expiresAt && ` В· РґРѕ ${p.expiresAt}`}
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
        <h2 className="text-[18px] font-bold">РњРѕРё РїСЂРѕРјРѕРєРѕРґС‹</h2>
        <p className="mt-1 text-[12px] text-bg-ivory/50">
          РўР°Рї РЅР° РєРѕРґ в†’ СЃРєРѕРїРёСЂРѕРІР°С‚СЊ. В«РџСЂРёРјРµРЅРёС‚СЊВ» в†’ РѕС‚РєСЂРѕРµС‚СЃСЏ Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ, РєРѕРґ РїРѕРґСЃС‚Р°РІРёС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.
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
                    if (tg?.showAlert) tg.showAlert(`РљРѕРґ ${p.code} СЃРєРѕРїРёСЂРѕРІР°РЅ`);
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
                РџСЂРёРјРµРЅРёС‚СЊ РїСЂРё Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРё в†’
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* history в†’ opens drawer */}
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
              <p className="text-[14px] font-semibold">РСЃС‚РѕСЂРёСЏ РІРёР·РёС‚РѕРІ</p>
              <p className="text-[11px] text-bg-ivory/60">
                {history.length} {history.length === 1 ? "Р·Р°РїРёСЃСЊ" : history.length < 5 ? "Р·Р°РїРёСЃРё" : "Р·Р°РїРёСЃРµР№"}
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
    const text = `РЇ Р·Р°РїРёСЃР°Р»СЃСЏ РІ Bravo Barbershop вњ‚пёЏ\n${b.serviceTitle}\n${dateLabel} РІ ${time}\n${b.branchName}`;
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
      ? "РЎРєРѕСЂРѕ"
      : b.status === "confirmed"
        ? "РџРѕРґС‚РІРµСЂР¶РґРµРЅРѕ"
        : b.status === "completed"
          ? "РџСЂРѕС€Р»Рѕ"
          : "РћС‚РјРµРЅР°";

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
      tg.showConfirm("РћС‚РјРµРЅРёС‚СЊ Р·Р°РїРёСЃСЊ?", (ok) => {
        if (ok) doIt();
      });
    } else if (typeof window !== "undefined" && window.confirm("РћС‚РјРµРЅРёС‚СЊ Р·Р°РїРёСЃСЊ?")) {
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
            {b.masterName} В· {b.branchName}
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
          {date} В· {time}
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
            title="РџРѕРґРµР»РёС‚СЊСЃСЏ РІ Telegram"
          >
            в†— РџРѕРґРµР»РёС‚СЊСЃСЏ
          </a>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelMut.isPending}
            className="flex-1 rounded-pill bg-destructive/15 px-3 py-2 text-[12px] font-medium text-destructive active:bg-destructive/25 disabled:opacity-50"
          >
            {cancelMut.isPending ? "..." : "РћС‚РјРµРЅРёС‚СЊ"}
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
            в†» РџРѕРІС‚РѕСЂРёС‚СЊ Р·Р°РїРёСЃСЊ
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
        РЎРїР°СЃРёР±Рѕ Р·Р° РѕС‚Р·С‹РІ вњЁ
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
        в… РћСЃС‚Р°РІРёС‚СЊ РѕС‚Р·С‹РІ
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
            aria-label={`${n} Р·РІС‘Р·Рґ`}
          >
            <span className={n <= rating ? "text-accent" : "text-bg-ivory/20"}>
              в…
            </span>
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Р Р°СЃСЃРєР°Р¶РёС‚Рµ Рѕ РІРёР·РёС‚РµвЂ¦"
        rows={3}
        className="w-full rounded-[16px] bg-bg-ivory/5 px-3 py-2 text-[13px] text-bg-ivory outline-none placeholder:text-bg-ivory/40 focus:bg-bg-ivory/10"
        maxLength={1000}
      />
      {createMut.isError ||
      (createMut.data && !createMut.data.ok && createMut.data.error) ? (
        <p className="text-[11px] text-red-400">
          {createMut.data?.error ?? "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РїСЂР°РІРёС‚СЊ РѕС‚Р·С‹РІ"}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-[12px] font-medium text-bg-ivory active:bg-bg-ivory/15"
        >
          РћС‚РјРµРЅР°
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
          {createMut.isPending ? "..." : "РћС‚РїСЂР°РІРёС‚СЊ"}
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
          <span className="caption text-accent-dark">РЈСЂРѕРІРµРЅСЊ {tierLabel}</span>
          <p className="mt-1 text-[28px] font-bold leading-none">
            {points.toLocaleString("ru-RU")}{" "}
            <span className="text-base font-medium">Р±РѕРЅСѓСЃРѕРІ</span>
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            РљРµС€Р±СЌРє <span className="font-semibold">{cashback}%</span>
            {view.nextTier
              ? ` В· РґРѕ ${view.nextTierLabel} РѕСЃС‚Р°Р»РѕСЃСЊ ${view.visitsToNextTier} РІРёР·РёС‚${view.visitsToNextTier === 1 ? "" : "РѕРІ"}`
              : " В· РјР°РєСЃРёРјР°Р»СЊРЅС‹Р№ СѓСЂРѕРІРµРЅСЊ"}
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
        Р’РёР·РёС‚РѕРІ: <b>{visits}</b> В· РџРѕС‚СЂР°С‡РµРЅРѕ:{" "}
        <b>{(view.profile?.totalSpent ?? 0).toLocaleString("ru-RU")} СЃСѓРј</b>
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
      title: "Р’Р°СѓС‡РµСЂС‹",
      desc: "РџРѕРґР°СЂРѕС‡РЅС‹Р№ РІР°СѓС‡РµСЂ РґР»СЏ РґСЂСѓРіР° РёР»Рё СЂРѕРґРЅС‹С….",
      body: "Р“РѕС‚РѕРІРёРј Р·Р°РїСѓСЃРє РїРѕРґР°СЂРѕС‡РЅС‹С… РІР°СѓС‡РµСЂРѕРІ: РјРѕР¶РЅРѕ Р±СѓРґРµС‚ РєСѓРїРёС‚СЊ РІР°СѓС‡РµСЂ РЅР° Р»СЋР±СѓСЋ СЃСѓРјРјСѓ Рё РїРѕРґР°СЂРёС‚СЊ С‡РµСЂРµР· Telegram. Р–РґС‘Рј РІР°СЃ РІ РѕР±РЅРѕРІР»РµРЅРёРё рџ’›",
    },
    favorites: {
      title: "Р›СЋР±РёРјС‹Рµ РјР°СЃС‚РµСЂР°",
      desc: "Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї Рє РёР·Р±СЂР°РЅРЅС‹Рј.",
      body: "РЎРєРѕСЂРѕ РґРѕР±Р°РІРёРј РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ СЃРѕС…СЂР°РЅСЏС‚СЊ Р»СЋР±РёРјС‹С… РјР°СЃС‚РµСЂРѕРІ РІ РёР·Р±СЂР°РЅРЅРѕРµ вЂ” Р·Р°РїРёСЃС‹РІР°Р№С‚РµСЃСЊ Рє РЅРёРј РІ РѕРґРёРЅ С‚Р°Рї. РЎРµР№С‡Р°СЃ РІС‹Р±РµСЂРёС‚Рµ РјР°СЃС‚РµСЂР° РЅР° СЃС‚СЂР°РЅРёС†Рµ СѓСЃР»СѓРіРё.",
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
              aria-label="РќР°Р·Р°Рґ"
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
            <span className="caption text-accent">РЎРєРѕСЂРѕ</span>
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
              aria-label="РќР°Р·Р°Рґ"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">Bravo Club</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            РџСЂРѕРіСЂР°РјРјР° Р»РѕСЏР»СЊРЅРѕСЃС‚Рё.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          <div className="rounded-[20px] bg-accent/15 p-4 border border-accent/20">
            <span className="caption text-accent">Р’Р°С€ СѓСЂРѕРІРµРЅСЊ</span>
            <p className="mt-1 text-[24px] font-bold text-bg-ivory">{tier}</p>
            <p className="mt-1 text-[13px] text-bg-ivory/70">
              РљРµС€Р±СЌРє {cashback}% СЃ РєР°Р¶РґРѕРіРѕ Р·Р°РІРµСЂС€С‘РЅРЅРѕРіРѕ РІРёР·РёС‚Р°.
            </p>
          </div>
          <div className="rounded-[20px] bg-bg-ivory/5 p-4 space-y-2 text-[13px]">
            <p className="font-semibold mb-1">РљР°Рє СЂР°Р±РѕС‚Р°СЋС‚ СѓСЂРѕРІРЅРё</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Medal className="h-4 w-4 text-[#cd7f32]" strokeWidth={1.8} /><b>Bronze</b> вЂ” 5% РєРµС€Р±СЌРє (РЅРѕРІС‹Р№ РєР»РёРµРЅС‚)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Medal className="h-4 w-4 text-bg-ivory/70" strokeWidth={1.8} /><b>Silver</b> вЂ” 8% (РїРѕСЃР»Рµ 3 РІРёР·РёС‚РѕРІ)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Trophy className="h-4 w-4 text-accent" strokeWidth={1.8} /><b>Gold</b> вЂ” 12% (РїРѕСЃР»Рµ 10 РІРёР·РёС‚РѕРІ)</p>
            <p className="flex items-center gap-2 text-bg-ivory/70"><Gem className="h-4 w-4 text-cyan-300" strokeWidth={1.8} /><b>Platinum</b> вЂ” 15% (РїРѕСЃР»Рµ 25 РІРёР·РёС‚РѕРІ)</p>
          </div>
          <div className="rounded-[20px] bg-bg-ivory/5 p-4 text-[13px] text-bg-ivory/80">
            <p className="font-semibold mb-1">РљР°Рє РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р±РѕРЅСѓСЃС‹</p>
            <p>РќР° С€Р°РіРµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ Р·Р°РїРёСЃРё РІРєР»СЋС‡РёС‚Рµ С‚СѓРјР±Р»РµСЂ В«РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р±РѕРЅСѓСЃС‹В» вЂ” РѕРїР»Р°С‚РёС‚Рµ РґРѕ 50% СЃС‚РѕРёРјРѕСЃС‚Рё РЅР°РєРѕРїР»РµРЅРЅС‹РјРё Р±Р°Р»Р»Р°РјРё.</p>
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
              aria-label="РќР°Р·Р°Рґ"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <div className="flex-1">
              <DrawerTitle className="text-bg-ivory">РќР°СЃС‚СЂРѕР№РєРё</DrawerTitle>
              <DrawerDescription className="text-bg-ivory/60">
                РЇР·С‹Рє РёРЅС‚РµСЂС„РµР№СЃР° Рё РїР°СЂР°РјРµС‚СЂС‹ Р°РєРєР°СѓРЅС‚Р°.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="rounded-[20px] bg-bg-ivory/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                РЇР·С‹Рє
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {([
                { code: "ru" as const, label: "Р СѓСЃСЃРєРёР№" },
                { code: "uz" as const, label: "OК»zbekcha" },
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
              РџРѕР»РЅС‹Р№ РїРµСЂРµРІРѕРґ РёРЅС‚РµСЂС„РµР№СЃР° РґРѕР±Р°РІРёРј РІ СЃР»РµРґСѓСЋС‰РµРј РѕР±РЅРѕРІР»РµРЅРёРё.
            </p>
          </div>

          <div className="rounded-[20px] bg-bg-ivory/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Cake className="h-4 w-4 text-accent" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                Р”РµРЅСЊ СЂРѕР¶РґРµРЅРёСЏ
              </span>
            </div>
            <p className="text-[12px] text-bg-ivory/60 mb-2">
              Р’ СЃРІРѕР№ РґРµРЅСЊ СЂРѕР¶РґРµРЅРёСЏ РїРѕР»СѓС‡РёС‚Рµ СЃРєРёРґРєСѓ 25% РЅР° Р»СЋР±СѓСЋ СѓСЃР»СѓРіСѓ.
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
                {setBirthdayMut.isPending ? "..." : "РЎРѕС…СЂР°РЅРёС‚СЊ"}
              </button>
            </div>
            {setBirthdayMut.isSuccess && (
              <p className="mt-2 text-[11px] text-accent">РЎРѕС…СЂР°РЅРµРЅРѕ вњ“</p>
            )}
          </div>

          {/* Push notifications */}
          {pushStatus.supported && vapidData?.ok && (
            <div className="rounded-[20px] bg-bg-ivory/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" strokeWidth={1.8} aria-hidden="true" />
                <span className="text-[13px] font-semibold uppercase tracking-wider text-bg-ivory/70">
                  Push-СѓРІРµРґРѕРјР»РµРЅРёСЏ
                </span>
              </div>
              <p className="text-[12px] text-bg-ivory/60 mb-3">
                РќР°РїРѕРјРёРЅР°РЅРёСЏ Рё РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ Р±СѓРґСѓС‚ РїСЂРёС…РѕРґРёС‚СЊ РєР°Рє РѕР±С‹С‡РЅС‹Рµ СѓРІРµРґРѕРјР»РµРЅРёСЏ С‚РµР»РµС„РѕРЅР°.
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
                    ? "РћС‚РєР»СЋС‡РёС‚СЊ push"
                    : "Р’РєР»СЋС‡РёС‚СЊ push"}
              </button>
              {pushStatus.permission === "denied" && (
                <p className="mt-2 text-[11px] text-red-400">
                  РЈРІРµРґРѕРјР»РµРЅРёСЏ Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹ РІ Р±СЂР°СѓР·РµСЂРµ. РћС‚РєСЂРѕР№С‚Рµ РЅР°СЃС‚СЂРѕР№РєРё СЃР°Р№С‚Р°.
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
            Р—Р°РєСЂС‹С‚СЊ Mini App
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
    "Р—Р°РїРёСЃС‹РІР°Р№СЃСЏ СЃРѕ РјРЅРѕР№ РІ Bravo Barbershop вњ‚пёЏ РџРѕР»СѓС‡РёС€СЊ 50 000 Р±РѕРЅСѓСЃРѕРІ РїСЂРё РїРµСЂРІРѕР№ Р·Р°РїРёСЃРё С‡РµСЂРµР· СЌС‚Сѓ СЃСЃС‹Р»РєСѓ:",
  )}`;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-bg-deep border-bg-ivory/10 text-bg-ivory">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={() => { haptic("light"); onClose(); }}
              aria-label="РќР°Р·Р°Рґ"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">РџСЂРёРіР»Р°СЃРё РґСЂСѓРіР°</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            РљРѕРіРґР° РґСЂСѓРі РѕС‚РєСЂРѕРµС‚ Bravo РїРѕ С‚РІРѕРµР№ СЃСЃС‹Р»РєРµ Рё Р·Р°РїРёС€РµС‚СЃСЏ вЂ” РѕР±Р° РїРѕР»СѓС‡РёС‚Рµ РїРѕ 50 000 Р±РѕРЅСѓСЃРѕРІ.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[14px] bg-bg-ivory/5 p-3">
              <p className="text-[10px] uppercase text-bg-ivory/50">РџСЂРёРіР»Р°С€РµРЅРѕ</p>
              <p className="mt-1 text-[20px] font-bold text-bg-ivory">
                {ref?.invitedCount ?? 0}
              </p>
            </div>
            <div className="rounded-[14px] bg-bg-ivory/5 p-3">
              <p className="text-[10px] uppercase text-bg-ivory/50">Р—Р°СЂР°Р±РѕС‚Р°РЅРѕ Р±РѕРЅСѓСЃРѕРІ</p>
              <p className="mt-1 text-[20px] font-bold text-accent">
                {ref?.bonusEarned ?? 0}
              </p>
            </div>
          </div>

          {inviteUrl && (
            <div className="rounded-[16px] bg-bg-ivory/5 p-3">
              <p className="text-[11px] uppercase text-bg-ivory/50 mb-1">Р’Р°С€Р° СЃСЃС‹Р»РєР°</p>
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
                  {copied ? "РЎРєРѕРїРёСЂРѕРІР°РЅРѕ" : "РЎРєРѕРїРёСЂРѕРІР°С‚СЊ"}
                </button>
                <a
                  href={tgShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => haptic("success")}
                  className="flex-1 rounded-pill bg-accent px-3 py-2 text-center text-[13px] font-medium text-accent-foreground active:opacity-90"
                >
                  РћС‚РїСЂР°РІРёС‚СЊ РІ TG
                </a>
              </div>
            </div>
          )}

          <div className="rounded-[16px] bg-bg-ivory/5 p-3 text-[12px] text-bg-ivory/70">
            <p className="font-semibold mb-1 text-bg-ivory">РљР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚</p>
            <p>1. РЎРєРѕРїРёСЂСѓР№ РёР»Рё РѕС‚РїСЂР°РІСЊ СЃСЃС‹Р»РєСѓ РґСЂСѓРіСѓ</p>
            <p>2. РћРЅ РѕС‚РєСЂРѕРµС‚ Bravo РїРѕ СЃСЃС‹Р»РєРµ Рё СЃРґРµР»Р°РµС‚ РїРµСЂРІСѓСЋ Р·Р°РїРёСЃСЊ</p>
            <p>3. РџРѕСЃР»Рµ Р·Р°РІРµСЂС€РµРЅРёСЏ РІРёР·РёС‚Р° РІС‹ РѕР±Р° РїРѕР»СѓС‡РёС‚Рµ 50 000 Р±РѕРЅСѓСЃРѕРІ</p>
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
              aria-label="РќР°Р·Р°Рґ"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">РњРѕР№ РєР°Р»РµРЅРґР°СЂСЊ РІРёР·РёС‚РѕРІ</DrawerTitle>
          </div>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/15"
              aria-label="РџСЂРµРґС‹РґСѓС‰РёР№ РјРµСЃСЏС†"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[15px] font-semibold capitalize">{monthName}</p>
            <button
              type="button"
              onClick={() => shift(1)}
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/15"
              aria-label="РЎР»РµРґСѓСЋС‰РёР№ РјРµСЃСЏС†"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-bg-ivory/50 mb-1">
            {["РџРЅ", "Р’С‚", "РЎСЂ", "Р§С‚", "РџС‚", "РЎР±", "Р’СЃ"].map((d) => (
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
              <span className="h-2 w-2 rounded-full bg-accent" /> РђРєС‚РёРІРЅС‹Рµ
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> РџСЂРѕС€РµРґС€РёРµ
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-bg-ivory/40" /> РћС‚РјРµРЅС‘РЅРЅС‹Рµ
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
              aria-label="РќР°Р·Р°Рґ"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10 active:bg-bg-ivory/20 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            </button>
            <DrawerTitle className="text-bg-ivory">РСЃС‚РѕСЂРёСЏ РІРёР·РёС‚РѕРІ</DrawerTitle>
          </div>
          <DrawerDescription className="text-bg-ivory/60">
            Р’СЃРµ РІР°С€Рё РїСЂРѕС€РµРґС€РёРµ Рё РѕС‚РјРµРЅС‘РЅРЅС‹Рµ Р·Р°РїРёСЃРё.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6">
          {history.length === 0 ? (
            <p className="text-center text-[13px] text-bg-ivory/50 py-8">
              РСЃС‚РѕСЂРёСЏ РїСѓСЃС‚Р°.
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
