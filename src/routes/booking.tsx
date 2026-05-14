import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { BottomNav } from "@/components/mini/BottomNav";
import { Button } from "@/components/ui/button";
import { formatDuration, formatSum } from "@/lib/mock";
import { useStore } from "@/lib/store";
import {
  useCreateBooking,
  useCreateGuestBooking,
  isInTelegram,
} from "@/lib/bookings-client";
import { useMyLoyalty, useSetMyPhone } from "@/lib/loyalty-client";
import { useToggleFavorite } from "@/lib/batch2-client";
import { useMyCerts, useMyPackages, useLookupCert } from "@/lib/batch4-client";
import { getTelegramWebApp, haptic } from "@/lib/telegram-client";
import {
  acquireLock,
  confirmBooking,
  formatCountdown,
  getSlots,
  holdsLock,
  refreshLock,
  releaseLock,
  slotKey,
  subscribe,
  LOCK_TTL_MS,
  type SlotInfo,
} from "@/lib/slots";
import {
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Clock,
  CalendarDays,
  Sparkles,
  Lock as LockIcon,
  Timer,
  Gift,
} from "lucide-react";

const searchSchema = z.object({
  step: z.coerce.number().min(1).max(6).optional().default(1),
  branch: z.string().optional(),
  services: z.string().optional(),
  master: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  lockKey: z.string().optional(),
  promo: z.string().optional(),
  /** Promo code from profile в†’ pre-fills voucher code field. */
  promo_code: z.string().optional(),
});

function parseServices(v?: string): string[] {
  if (!v) return [];
  return v.split(",").filter(Boolean);
}
function serializeServices(ids: string[]): string | undefined {
  return ids.length ? ids.join(",") : undefined;
}

export const Route = createFileRoute("/booking")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Р—Р°РїРёСЃСЊ вЂ” Bravo" },
      { name: "description", content: "РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ РІ Р±Р°СЂР±РµСЂС€РѕРї Bravo Р·Р° РјРёРЅСѓС‚Сѓ." },
    ],
  }),
  component: BookingWizard,
});

const steps = [
  "Р¤РёР»РёР°Р»",
  "РЈСЃР»СѓРіРё",
  "РњР°СЃС‚РµСЂ",
  "Р”Р°С‚Р° Рё РІСЂРµРјСЏ",
  "РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ",
  "Р“РѕС‚РѕРІРѕ",
];

function BookingWizard() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/booking" });
  const step = search.step ?? 1;
  const { branches, services, masters } = useStore();

  const updateSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });

  const goto = (s: number) => updateSearch({ step: s });

  const selectedServiceIds = parseServices(search.services);
  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id),
  );
  const selectedBranch = branches.find((b) => b.id === search.branch);
  const selectedMaster = masters.find((m) => m.id === search.master);

  return (
    <main className="mx-auto min-h-screen max-w-md md:max-w-2xl bg-bg-deep pb-28 text-bg-ivory">
      <header className="sticky top-0 z-20 bg-bg-deep/90 px-5 pt-10 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {step > 1 && step < 6 ? (
            <button
              onClick={() => goto(step - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-pill bg-bg-ivory/10"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
            </button>
          ) : (
            <Link
              to="/"
              className="flex h-10 w-10 items-center justify-center rounded-pill bg-bg-ivory/10"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
            </Link>
          )}
          <div className="flex-1">
            <span className="caption text-accent">
              РЁР°Рі {Math.min(step, 5)} РёР· 5
            </span>
            <h1 className="text-[20px] font-bold">{steps[step - 1]}</h1>
          </div>
        </div>
        {step < 6 && (
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-bg-ivory/15"
                }`}
              />
            ))}
          </div>
        )}
      </header>

      <div className="px-5 pt-4">
        {step === 1 && (
          <BranchStep
            value={search.branch}
            onPick={(id) => {
              updateSearch({ branch: id, step: 2 });
            }}
          />
        )}
        {step === 2 && (
          <ServiceStep
            value={selectedServiceIds}
            onContinue={(ids) =>
              updateSearch({ services: serializeServices(ids), step: 3 })
            }
          />
        )}
        {step === 3 && (
          <MasterStep
            serviceIds={selectedServiceIds}
            value={search.master}
            onPick={(id) => updateSearch({ master: id, step: 4 })}
          />
        )}
        {step === 4 && (
          <DateTimeStep
            branchId={search.branch}
            masterId={search.master}
            serviceIds={selectedServiceIds}
            date={search.date}
            time={search.time}
            lockKey={search.lockKey}
            onPick={(date, time, lockKey) =>
              updateSearch({ date, time, lockKey, step: 5 })
            }
          />
        )}
        {step === 5 && (
          <ConfirmStep
            services={selectedServices}
            branch={selectedBranch}
            master={selectedMaster}
            date={search.date}
            time={search.time}
            lockKey={search.lockKey}
            promoId={search.promo}
            initialPromoCode={search.promo_code}
            onConfirm={() => updateSearch({ step: 6 })}
            onSlotLost={() => updateSearch({ step: 4, time: undefined, lockKey: undefined })}
          />
        )}
        {step === 6 && (
          <SuccessStep
            services={selectedServices}
            branch={selectedBranch}
            date={search.date}
            time={search.time}
          />
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function BranchStep({
  value,
  onPick,
}: {
  value?: string;
  onPick: (id: string) => void;
}) {
  const { branches } = useStore();
  return (
    <div className="space-y-3">
      {branches.map((b) => (
        <button
          key={b.id}
          onClick={() => onPick(b.id)}
          className={`group flex w-full items-center gap-3 rounded-[24px] border p-3 text-left transition-all ${
            value === b.id
              ? "border-accent bg-accent/10"
              : "border-bg-ivory/10 bg-bg-ivory/5 hover:bg-bg-ivory/10"
          }`}
        >
          <img
            src={b.image}
            alt={b.name}
            loading="lazy"
            className="h-16 w-16 rounded-[16px] object-cover"
          />
          <div className="flex-1">
            <p className="text-[15px] font-semibold">{b.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] text-bg-ivory/60">
              <MapPin className="h-3 w-3" />
              {b.address}
            </p>
            <p className="text-[12px] text-bg-ivory/60">{b.hours}</p>
          </div>
          <span className="caption text-accent">{b.distanceKm} РєРј</span>
        </button>
      ))}
    </div>
  );
}

function ServiceStep({
  value,
  onContinue,
}: {
  value: string[];
  onContinue: (ids: string[]) => void;
}) {
  const { services } = useStore();
  const [picked, setPicked] = useState<string[]>(value);

  const toggle = (id: string) => {
    haptic("select");
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const total = services
    .filter((s) => picked.includes(s.id))
    .reduce(
      (acc, s) => ({ price: acc.price + s.price, dur: acc.dur + s.durationMin }),
      { price: 0, dur: 0 },
    );

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-bg-ivory/60">
        РњРѕР¶РЅРѕ РІС‹Р±СЂР°С‚СЊ РЅРµСЃРєРѕР»СЊРєРѕ СѓСЃР»СѓРі вЂ” РјР°СЃС‚РµСЂ РІС‹РїРѕР»РЅРёС‚ РёС… РїРѕРґСЂСЏРґ.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {services.map((s) => {
          const selected = picked.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => toggle(s.id)}
              className={`group relative overflow-hidden rounded-[20px] border bg-bg-ivory/5 text-left transition-all ${
                selected ? "border-accent ring-2 ring-accent/30" : "border-transparent"
              }`}
            >
              <img
                src={s.image}
                alt={s.title}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <span
                className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-pill text-[11px] font-bold transition-all ${
                  selected
                    ? "bg-accent text-accent-foreground"
                    : "bg-bg-deep/60 text-bg-ivory/70 backdrop-blur-md"
                }`}
                aria-hidden="true"
              >
                {selected ? <Check className="h-4 w-4" /> : "+"}
              </span>
              <div className="p-3">
                <p className="text-[13px] font-semibold leading-tight">{s.title}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] text-bg-ivory/60">
                  <span>{formatDuration(s.durationMin)}</span>
                  <span className="font-semibold text-accent">
                    {formatSum(s.price).replace(" СЃСѓРј", "")}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-24 z-10 -mx-5 px-5">
        <div className="rounded-[24px] bg-bg-deep/95 p-3 backdrop-blur-xl border border-bg-ivory/10 shadow-warm-lg">
          <div className="mb-2 flex items-center justify-between text-[13px]">
            <span className="text-bg-ivory/60">
              {picked.length === 0
                ? "РќРµ РІС‹Р±СЂР°РЅРѕ"
                : `Р’С‹Р±СЂР°РЅРѕ: ${picked.length} В· ${formatDuration(total.dur)}`}
            </span>
            <span className="font-bold text-accent">{formatSum(total.price)}</span>
          </div>
          <Button
            variant="pill-accent"
            size="lg"
            className="w-full"
            disabled={picked.length === 0}
            onClick={() => onContinue(picked)}
          >
            РџСЂРѕРґРѕР»Р¶РёС‚СЊ{picked.length > 0 ? ` (${picked.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MasterStep({
  serviceIds,
  value,
  onPick,
}: {
  serviceIds: string[];
  value?: string;
  onPick: (id: string) => void;
}) {
  const { masters } = useStore();
  const { data: loyalty } = useMyLoyalty();
  const favs = new Set(loyalty?.profile?.favoriteMasters ?? []);
  const toggleFavMut = useToggleFavorite();

  const list =
    serviceIds.length > 0
      ? masters.filter((m) =>
          serviceIds.every((sid) => m.serviceIds.includes(sid)),
        )
      : masters;
  // Favorites first.
  const sorted = [...list].sort((a, b) => {
    const af = favs.has(a.id) ? 0 : 1;
    const bf = favs.has(b.id) ? 0 : 1;
    return af - bf;
  });

  return (
    <div className="space-y-3">
      <button
        onClick={() => onPick("any")}
        className={`flex w-full items-center gap-3 rounded-[24px] border p-3 text-left ${
          value === "any"
            ? "border-accent bg-accent/10"
            : "border-bg-ivory/10 bg-bg-ivory/5"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-accent/20 text-accent">
          <Sparkles className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-semibold">Р›СЋР±РѕР№ СЃРІРѕР±РѕРґРЅС‹Р№ РјР°СЃС‚РµСЂ</p>
          <p className="text-[12px] text-bg-ivory/60">
            РџРѕРґР±РµСЂС‘Рј РїРѕ РІСЂРµРјРµРЅРё Рё СѓСЃР»СѓРіРµ
          </p>
        </div>
      </button>

      {sorted.map((m) => {
        const isFav = favs.has(m.id);
        return (
          <div
            key={m.id}
            className={`flex w-full items-center gap-3 rounded-[24px] border p-3 ${
              value === m.id
                ? "border-accent bg-accent/10"
                : "border-bg-ivory/10 bg-bg-ivory/5"
            }`}
          >
            <button
              onClick={() => onPick(m.id)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <img
                src={m.image}
                alt={m.name}
                loading="lazy"
                className="h-12 w-12 rounded-pill object-cover"
              />
              <div className="flex-1">
                <p className="text-[15px] font-semibold">{m.name}</p>
                <p className="text-[12px] text-bg-ivory/60">{m.role}</p>
              </div>
              <span className="text-[13px] font-semibold text-accent">
                в… {m.rating}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                haptic("select");
                toggleFavMut.mutate(m.id);
              }}
              aria-label={isFav ? "РЈР±СЂР°С‚СЊ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ" : "Р’ РёР·Р±СЂР°РЅРЅРѕРµ"}
              className={`flex h-9 w-9 items-center justify-center rounded-pill transition-colors ${
                isFav ? "bg-accent/20 text-accent" : "bg-bg-ivory/10 text-bg-ivory/60"
              }`}
            >
              в™Ґ
            </button>
          </div>
        );
      })}
    </div>
  );
}

function DateTimeStep({
  branchId,
  masterId,
  serviceIds,
  date,
  time,
  lockKey,
  onPick,
}: {
  branchId?: string;
  masterId?: string;
  serviceIds: string[];
  date?: string;
  time?: string;
  lockKey?: string;
  onPick: (date: string, time: string, lockKey: string) => void;
}) {
  // For lock filtering we use the first service id (mock simplification).
  const serviceId = serviceIds[0];
  const days = useMemo(() => {
    const arr: { iso: string; day: string; date: number; weekday: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      arr.push({
        iso: d.toISOString().slice(0, 10),
        day: d.toLocaleDateString("ru-RU", { weekday: "short" }),
        date: d.getDate(),
        weekday: d.toLocaleDateString("ru-RU", { month: "short" }),
      });
    }
    return arr;
  }, []);

  const [pickedDate, setPickedDate] = useState(date ?? days[0].iso);
  const [pickedTime, setPickedTime] = useState(time ?? "");
  const [activeLock, setActiveLock] = useState<string | undefined>(lockKey);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const u = subscribe(() => setTick((n) => n + 1)); return () => { u(); }; }, []);

  const slots: SlotInfo[] = useMemo(
    () =>
      branchId
        ? getSlots(branchId, masterId ?? "any", pickedDate, serviceId)
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branchId, masterId, serviceId, pickedDate, tick]
  );

  const handlePickTime = (t: string) => {
    if (!branchId) return;
    setError(null);
    const res = acquireLock(
      branchId,
      masterId ?? "any",
      pickedDate,
      t,
      serviceId,
      activeLock
    );
    if (!res.ok) {
      haptic("error");
      setError("Р­С‚РѕС‚ СЃР»РѕС‚ С‚РѕР»СЊРєРѕ С‡С‚Рѕ Р·Р°РЅСЏР»Рё. Р’С‹Р±РµСЂРёС‚Рµ РґСЂСѓРіРѕР№.");
      return;
    }
    haptic("select");
    setPickedTime(t);
    setActiveLock(res.key);
    setTick((n) => n + 1);
  };

  const handleDate = (iso: string) => {
    if (activeLock) releaseLock(activeLock);
    setActiveLock(undefined);
    setTick((n) => n + 1);
    setPickedTime("");
    setPickedDate(iso);
  };

  const myMsLeft = slots.find((s) => s.status === "mine")?.msLeft;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="caption text-bg-ivory/60">Р”Р°С‚Р°</h3>
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d) => (
            <button
              key={d.iso}
              onClick={() => handleDate(d.iso)}
              className={`flex shrink-0 flex-col items-center rounded-[18px] border px-4 py-3 transition-all ${
                pickedDate === d.iso
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-bg-ivory/10 bg-bg-ivory/5 text-bg-ivory"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {d.day}
              </span>
              <span className="mt-0.5 text-xl font-bold leading-none">
                {d.date}
              </span>
              <span className="mt-0.5 text-[10px] opacity-70">{d.weekday}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="caption text-bg-ivory/60">Р’СЂРµРјСЏ</h3>
          {myMsLeft !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
              <Timer className="h-3 w-3" />
              РЈРґРµСЂР¶Р°РЅРёРµ {formatCountdown(myMsLeft)}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {slots.map((s) => {
            const disabled =
              s.status === "past" ||
              s.status === "booked" ||
              s.status === "locked";
            const cls =
              s.status === "past"
                ? "bg-bg-ivory/5 text-bg-ivory/20 line-through"
                : s.status === "booked"
                  ? "bg-bg-ivory/5 text-bg-ivory/25"
                  : s.status === "locked"
                    ? "bg-amber-500/10 text-amber-200/70"
                    : s.status === "mine" || pickedTime === s.time
                      ? "bg-accent text-accent-foreground"
                      : "bg-bg-ivory/10 text-bg-ivory hover:bg-bg-ivory/15";
            return (
              <button
                key={s.time}
                disabled={disabled}
                onClick={() => handlePickTime(s.time)}
                title={
                  s.status === "locked"
                    ? "РЎРµР№С‡Р°СЃ Р±СЂРѕРЅРёСЂСѓРµС‚СЃСЏ РґСЂСѓРіРёРј РєР»РёРµРЅС‚РѕРј"
                    : s.status === "booked"
                      ? "РЈР¶Рµ Р·Р°РЅСЏС‚Рѕ"
                      : ""
                }
                className={`relative rounded-[14px] py-2.5 text-[13px] font-semibold transition-all ${cls}`}
              >
                {s.time}
                {s.status === "locked" && (
                  <LockIcon className="absolute right-1 top-1 h-2.5 w-2.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-bg-ivory/55">
          <Legend dot="bg-accent" label="РІР°С€ РІС‹Р±РѕСЂ" />
          <Legend dot="bg-bg-ivory/30" label="СЃРІРѕР±РѕРґРЅРѕ" />
          <Legend dot="bg-amber-500/60" label="Р±СЂРѕРЅРёСЂСѓРµС‚СЃСЏ" />
          <Legend dot="bg-bg-ivory/15" label="Р·Р°РЅСЏС‚Рѕ" />
        </div>

        {error && (
          <p className="mt-3 rounded-[14px] bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
            {error}
          </p>
        )}
      </div>

      <Button
        variant="pill-accent"
        size="lg"
        className="w-full"
        disabled={!pickedTime || !activeLock}
        onClick={() => activeLock && onPick(pickedDate, pickedTime, activeLock)}
      >
        РџСЂРѕРґРѕР»Р¶РёС‚СЊ
      </Button>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ConfirmStep({
  services,
  branch,
  master,
  date,
  time,
  lockKey,
  promoId,
  initialPromoCode,
  onConfirm,
  onSlotLost,
}: {
  services: import("@/lib/store").Service[];
  branch?: import("@/lib/store").Branch;
  master?: import("@/lib/store").Master;
  date?: string;
  time?: string;
  lockKey?: string;
  promoId?: string;
  initialPromoCode?: string;
  onConfirm: () => void;
  onSlotLost: () => void;
}) {
  const [, force] = useState(0);
  useEffect(() => { const u = subscribe(() => force((n) => n + 1)); return () => { u(); }; }, []);
  useEffect(() => {
    if (lockKey) refreshLock(lockKey);
  }, [lockKey]);

  const createBookingMut = useCreateBooking();
  const createGuestBookingMut = useCreateGuestBooking();
  const inTg = isInTelegram();
  const { data: loyalty } = useMyLoyalty();
  const { data: myCerts } = useMyCerts();
  const { data: myPkgs } = useMyPackages();
  const lookupCertMut = useLookupCert();
  const setPhoneMut = useSetMyPhone();
  const [useBonus, setUseBonus] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [certCode, setCertCode] = useState(initialPromoCode ?? "");
  // If user came in via "РџСЂРёРјРµРЅРёС‚СЊ РїСЂРѕРјРѕРєРѕРґ" from profile, try the code on mount.
  const lookupCertMutLocal = useLookupCert();
  useEffect(() => {
    if (!initialPromoCode) return;
    let cancelled = false;
    lookupCertMutLocal
      .mutateAsync(initialPromoCode)
      .then((r) => {
        if (cancelled) return;
        if (r.ok && r.cert) {
          setAppliedCert({ code: r.cert.code, balance: r.cert.amountBalance });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPromoCode]);
  const [certError, setCertError] = useState<string | null>(null);
  const [appliedCert, setAppliedCert] = useState<{ code: string; balance: number } | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  useEffect(() => {
    setPhone(loyalty?.profile?.phone ?? "");
  }, [loyalty?.profile?.phone]);
  const phoneSaved = !!loyalty?.profile?.phone;
  const { promos } = useStore();
  const totalDuration = services.reduce((a, s) => a + s.durationMin, 0);
  const totalPrice = services.reduce((a, s) => a + s.price, 0);
  const availableBonus = loyalty?.profile?.bonusPoints ?? 0;

  // Promo: if a promoId was carried in URL and the promo's serviceIds match
  // (or it covers all services), discount totalPrice by promo.discountPct.
  const promo = promoId ? promos.find((p) => p.id === promoId) : undefined;
  const promoServicesMatch = promo
    ? !promo.serviceIds || promo.serviceIds.length === 0
      ? true
      : services.some((s) => promo.serviceIds.includes(s.id))
    : false;
  const promoEligible = !!promo && promoServicesMatch && (promo.discountPct ?? 0) > 0;
  const promoDiscount = promoEligible
    ? Math.floor((totalPrice * (promo!.discountPct ?? 0)) / 100)
    : 0;
  const priceAfterPromo = Math.max(0, totalPrice - promoDiscount);

  const maxBonusApply = Math.min(availableBonus, Math.floor(priceAfterPromo / 2));
  const bonusToApply = useBonus ? maxBonusApply : 0;
  const eligiblePkgs = (myPkgs ?? []).filter(
    (p) =>
      !p.serviceId ||
      services.some((s) => s.id === p.serviceId),
  );
  const selectedPkg = eligiblePkgs.find((p) => p.id === packageId);
  const certApply = appliedCert
    ? Math.min(appliedCert.balance, Math.max(0, priceAfterPromo - bonusToApply))
    : 0;
  const finalPrice = selectedPkg
    ? 0
    : Math.max(0, priceAfterPromo - bonusToApply - certApply);
  const dataReady = !!(services.length > 0 && branch && date && time && lockKey);
  const stillHolds = dataReady ? holdsLock(lockKey!) : false;

  const handle = async () => {
    if (!dataReady) return;
    if (!confirmBooking(lockKey!)) {
      haptic("error");
      onSlotLost();
      return;
    }
    const title =
      services.length === 1
        ? services[0].title
        : `${services[0].title} +${services.length - 1}`;
    const trimmedPhone = phone.trim();
    const trimmedName = guestName.trim();

    // Guest path: no Telegram в†’ require name + phone
    if (!inTg) {
      if (!trimmedName || !trimmedPhone) {
        haptic("error");
        const msg = "Р’РІРµРґРёС‚Рµ РёРјСЏ Рё РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°";
        if (typeof window !== "undefined") window.alert(msg);
        return;
      }
      try {
        const res = await createGuestBookingMut.mutateAsync({
          customerName: trimmedName,
          customerPhone: trimmedPhone,
          serviceTitle: title,
          serviceIds: services.map((s) => s.id),
          masterId: master?.id,
          masterName: master?.name ?? "Р›СЋР±РѕР№ СЃРІРѕР±РѕРґРЅС‹Р№",
          branchId: branch!.id,
          branchName: branch!.name,
          startAt: `${date}T${time}:00`,
          durationMin: totalDuration,
          price: totalPrice,
          promoId: promoEligible ? promoId : undefined,
        });
        if (!res.ok) {
          const msg = res.error ?? "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°РїРёСЃСЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.";
          if (typeof window !== "undefined") window.alert(msg);
          onSlotLost();
          return;
        }
      } catch (e) {
        console.warn("[guest-booking] create threw:", e);
        if (typeof window !== "undefined")
          window.alert("РћС€РёР±РєР° СЃРµС‚Рё. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.");
        return;
      }
      onConfirm();
      return;
    }

    // Telegram path: save phone in profile (if changed), then create booking with auth.
    if (trimmedPhone && trimmedPhone !== loyalty?.profile?.phone) {
      try {
        await setPhoneMut.mutateAsync(trimmedPhone);
      } catch (e) {
        console.warn("[booking] save phone failed:", e);
      }
    }

    try {
      const res = await createBookingMut.mutateAsync({
        serviceTitle: title,
        serviceIds: services.map((s) => s.id),
        masterId: master?.id,
        masterName: master?.name ?? "Р›СЋР±РѕР№ СЃРІРѕР±РѕРґРЅС‹Р№",
        branchId: branch!.id,
        branchName: branch!.name,
        startAt: `${date}T${time}:00`,
        durationMin: totalDuration,
        price: totalPrice,
        useBonus: bonusToApply,
        certCode: appliedCert?.code,
        packageId: selectedPkg?.id,
        promoId: promoEligible ? promoId : undefined,
      });
      if (!res.ok) {
        haptic("error");
        const tg = getTelegramWebApp() as unknown as {
          showAlert?: (m: string) => void;
        };
        const msg = res.error ?? "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ Р·Р°РїРёСЃСЊ. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.";
        if (tg?.showAlert) tg.showAlert(msg);
        else if (typeof window !== "undefined") window.alert(msg);
        onSlotLost();
        return;
      }
      haptic("success");
    } catch (e) {
      console.warn("[booking] create threw:", e);
      haptic("error");
    }
    onConfirm();
  };

  if (!dataReady) {
    return (
      <p className="text-[14px] text-bg-ivory/60">
        РќРµ С…РІР°С‚Р°РµС‚ РґР°РЅРЅС‹С…. Р’РµСЂРЅРёС‚РµСЃСЊ Рё Р·Р°РїРѕР»РЅРёС‚Рµ РІСЃРµ С€Р°РіРё.
      </p>
    );
  }

  const formattedDate = new Date(date!).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] glass-card p-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-bg-ivory/50 mb-2">
            РЈСЃР»СѓРіРё ({services.length}) В· {formatDuration(totalDuration)}
          </p>
          <div className="space-y-1.5">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-[14px]">
                <span className="text-bg-ivory">{s.title}</span>
                <span className="text-bg-ivory/60">{formatSum(s.price)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="h-px bg-bg-ivory/10" />
        <Row icon={<MapPin />} label="Р¤РёР»РёР°Р»" value={branch.name} sub={branch.address} />
        <Row
          icon={<Sparkles />}
          label="РњР°СЃС‚РµСЂ"
          value={master?.name ?? "Р›СЋР±РѕР№ СЃРІРѕР±РѕРґРЅС‹Р№"}
        />
        <Row icon={<CalendarDays />} label="РљРѕРіРґР°" value={formattedDate} sub={time} />
      </div>

      <div className={`flex items-center gap-2 rounded-[16px] px-3 py-2 text-[12px] ${stillHolds ? "bg-accent/10 text-accent" : "bg-red-500/10 text-red-300"}`}>
        <Timer className="h-3.5 w-3.5" aria-hidden="true" />
        {stillHolds
          ? `РЎР»РѕС‚ СѓРґРµСЂР¶РёРІР°РµС‚СЃСЏ Р·Р° РІР°РјРё РґРѕ ${Math.ceil(LOCK_TTL_MS / 60000)} РјРёРЅСѓС‚ вЂ” РїРѕРґС‚РІРµСЂРґРёС‚Рµ Р·Р°РїРёСЃСЊ.`
          : "Р’СЂРµРјСЏ СѓРґРµСЂР¶Р°РЅРёСЏ СЃР»РѕС‚Р° РёСЃС‚РµРєР»Рѕ. Р’С‹Р±РµСЂРёС‚Рµ РІСЂРµРјСЏ Р·Р°РЅРѕРІРѕ."}
      </div>

      {/* Guest mode: ask for name (TG users already have first_name). */}
      {!inTg && (
        <div className="rounded-[20px] bg-bg-ivory/5 p-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-bg-ivory/50">
              Р’Р°С€Рµ РёРјСЏ *
            </span>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="РќР°РїСЂРёРјРµСЂ: РўРёРјСѓСЂ"
              className="mt-1 w-full bg-transparent text-[15px] text-bg-ivory outline-none placeholder:text-bg-ivory/30"
              autoComplete="name"
            />
          </label>
        </div>
      )}

      {/* Phone field вЂ” required for callback. */}
      <div className="rounded-[20px] bg-bg-ivory/5 p-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-bg-ivory/50">
            РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР° {!inTg && "*"}
          </span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
            className="mt-1 w-full bg-transparent text-[15px] text-bg-ivory outline-none placeholder:text-bg-ivory/30"
            autoComplete="tel"
          />
        </label>
        <p className="mt-1 text-[11px] text-bg-ivory/50">
          {!inTg
            ? "Р‘Р°СЂР±РµСЂС€РѕРї СЃРІСЏР¶РµС‚СЃСЏ СЃ РІР°РјРё РґР»СЏ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ."
            : phoneSaved
              ? "РЎРѕС…СЂР°РЅС‘РЅ РІ РїСЂРѕС„РёР»Рµ. РњРѕР¶РЅРѕ РёР·РјРµРЅРёС‚СЊ."
              : "РЎРѕС…СЂР°РЅРёРј РІ РїСЂРѕС„РёР»Рµ РґР»СЏ Р±СѓРґСѓС‰РёС… Р·Р°РїРёСЃРµР№. РќР° РЅРµРіРѕ РїРѕР·РІРѕРЅРёС‚ Р±Р°СЂР±РµСЂС€РѕРї РїСЂРё РЅРµРѕР±С…РѕРґРёРјРѕСЃС‚Рё."}
        </p>
      </div>

      {/* Active packages: pick one to use a visit */}
      {inTg && eligiblePkgs.length > 0 && (
        <div className="rounded-[20px] bg-bg-ivory/5 p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-bg-ivory/50">
            РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р°Р±РѕРЅРµРјРµРЅС‚
          </p>
          <div className="space-y-1.5">
            {eligiblePkgs.map((p) => {
              const left = p.totalVisits - p.usedVisits;
              const selected = packageId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    haptic("select");
                    setPackageId(selected ? null : p.id);
                  }}
                  className={`flex w-full items-center justify-between rounded-[12px] border p-2.5 text-left ${
                    selected
                      ? "border-accent bg-accent/10"
                      : "border-bg-ivory/10 bg-bg-ivory/5"
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-semibold">{p.title}</p>
                    <p className="text-[11px] text-bg-ivory/60">
                      РћСЃС‚Р°Р»РѕСЃСЊ {left} РІРёР·РёС‚РѕРІ
                    </p>
                  </div>
                  <span className={`text-[18px] ${selected ? "text-accent" : "text-bg-ivory/30"}`}>
                    {selected ? "в—Џ" : "в—‹"}
                  </span>
                </button>
              );
            })}
          </div>
          {packageId && (
            <p className="text-[11px] text-accent">
              вњ“ РћРґРёРЅ РІРёР·РёС‚ СЃРїРёС€РµС‚СЃСЏ СЃ Р°Р±РѕРЅРµРјРµРЅС‚Р°. РЎС‚РѕРёРјРѕСЃС‚СЊ = 0 СЃСѓРј.
            </p>
          )}
        </div>
      )}

      {/* Certificate code entry вЂ” only in Telegram (cert is bound to a TG user) */}
      {inTg && !packageId && (
        <div className="rounded-[20px] bg-bg-ivory/5 p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-bg-ivory/50">
            Р’Р°СѓС‡РµСЂ
          </p>
          {appliedCert ? (
            <div className="flex items-center justify-between rounded-[12px] bg-accent/10 p-3">
              <div>
                <p className="text-[13px] font-semibold text-accent">
                  вњ“ {appliedCert.code}
                </p>
                <p className="text-[11px] text-bg-ivory/60">
                  Р‘Р°Р»Р°РЅСЃ: {appliedCert.balance.toLocaleString("ru-RU")} СЃСѓРј. Рљ СЃРїРёСЃР°РЅРёСЋ:{" "}
                  {certApply.toLocaleString("ru-RU")} СЃСѓРј.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedCert(null);
                  setCertCode("");
                }}
                className="rounded-pill bg-bg-ivory/10 px-2.5 py-1 text-[11px] text-bg-ivory hover:bg-bg-ivory/15"
              >
                РЈР±СЂР°С‚СЊ
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certCode}
                  onChange={(e) => {
                    setCertCode(e.target.value.toUpperCase());
                    setCertError(null);
                  }}
                  placeholder="BRAVO-XXXXXX"
                  className="flex-1 rounded-pill bg-bg-ivory/10 px-3 py-2 text-[13px] font-mono uppercase text-bg-ivory outline-none placeholder:text-bg-ivory/40"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!certCode.trim()) return;
                    const r = await lookupCertMut.mutateAsync(certCode);
                    if (r.ok && r.cert) {
                      setAppliedCert({
                        code: r.cert.code,
                        balance: r.cert.amountBalance,
                      });
                      setCertError(null);
                      haptic("success");
                    } else {
                      setCertError(r.error ?? "РќРµ РЅР°Р№РґРµРЅРѕ");
                      haptic("error");
                    }
                  }}
                  disabled={lookupCertMut.isPending}
                  className="rounded-pill bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground active:opacity-90 disabled:opacity-50"
                >
                  {lookupCertMut.isPending ? "..." : "РџСЂРёРјРµРЅРёС‚СЊ"}
                </button>
              </div>
              {(myCerts ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(myCerts ?? []).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setAppliedCert({
                          code: c.code,
                          balance: c.amountBalance,
                        })
                      }
                      className="rounded-pill bg-accent/10 px-2.5 py-1 text-[11px] font-mono text-accent hover:bg-accent/20"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              )}
              {certError && <p className="text-[11px] text-red-400">{certError}</p>}
            </>
          )}
        </div>
      )}

      {inTg && availableBonus > 0 && (
        <button
          type="button"
          onClick={() => {
            haptic("select");
            setUseBonus((v) => !v);
          }}
          className={`flex w-full items-center justify-between rounded-[20px] border p-4 text-left transition-all ${
            useBonus
              ? "border-accent bg-accent/10"
              : "border-bg-ivory/10 bg-bg-ivory/5"
          }`}
        >
          <div>
            <p className="text-[14px] font-semibold">
              РСЃРїРѕР»СЊР·РѕРІР°С‚СЊ Р±РѕРЅСѓСЃС‹{useBonus ? "" : "?"}
            </p>
            <p className="mt-0.5 text-[12px] text-bg-ivory/60">
              Р”РѕСЃС‚СѓРїРЅРѕ: {availableBonus.toLocaleString("ru-RU")} В· РјР°РєСЃРёРјСѓРј{" "}
              {maxBonusApply.toLocaleString("ru-RU")} Рє СЌС‚РѕР№ Р·Р°РїРёСЃРё
            </p>
          </div>
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
              useBonus ? "bg-accent" : "bg-bg-ivory/20"
            }`}
            aria-hidden="true"
          >
            <span
              className={`block h-5 w-5 rounded-full bg-bg-ivory transition-transform ${
                useBonus ? "translate-x-5" : ""
              }`}
            />
          </span>
        </button>
      )}

      <div className="rounded-[24px] bg-bg-ivory/5 p-4">
        <div className="flex items-center justify-between text-[14px] text-bg-ivory/70">
          <span>РЎС‚РѕРёРјРѕСЃС‚СЊ ({services.length} {services.length === 1 ? "СѓСЃР»СѓРіР°" : "СѓСЃР»СѓРі"})</span>
          <span>{formatSum(totalPrice)}</span>
        </div>
        {promoEligible && promoDiscount > 0 && (
          <div className="mt-1 flex items-center justify-between text-[14px] text-accent">
            <span className="inline-flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" strokeWidth={1.8} />РђРєС†РёСЏ В«{promo!.title}В» в€’{promo!.discountPct}%</span>
            <span>в€’{promoDiscount.toLocaleString("ru-RU")}</span>
          </div>
        )}
        {bonusToApply > 0 && (
          <div className="mt-1 flex items-center justify-between text-[14px] text-accent">
            <span>Р‘РѕРЅСѓСЃР°РјРё</span>
            <span>в€’{bonusToApply.toLocaleString("ru-RU")}</span>
          </div>
        )}
        {certApply > 0 && !selectedPkg && (
          <div className="mt-1 flex items-center justify-between text-[14px] text-accent">
            <span>Р’Р°СѓС‡РµСЂРѕРј</span>
            <span>в€’{certApply.toLocaleString("ru-RU")}</span>
          </div>
        )}
        {selectedPkg && (
          <div className="mt-1 flex items-center justify-between text-[14px] text-accent">
            <span>РђР±РѕРЅРµРјРµРЅС‚</span>
            <span>в€’{totalPrice.toLocaleString("ru-RU")} (1 РІРёР·РёС‚)</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between text-[18px] font-bold">
          <span>РС‚РѕРіРѕ</span>
          <span className="text-accent">{formatSum(finalPrice)}</span>
        </div>
        <p className="mt-2 text-[11px] text-bg-ivory/50">
          РћРїР»Р°С‚Р° РІ Р±Р°СЂР±РµСЂС€РѕРїРµ. РћС‚РјРµРЅР° Р±РµСЃРїР»Р°С‚РЅР° Р·Р° 24 С‡Р°СЃР°.
        </p>
      </div>

      {stillHolds ? (
        <div className="space-y-2">
          <Button variant="pill-accent" size="lg" className="w-full" onClick={handle}>
            РџРѕРґС‚РІРµСЂРґРёС‚СЊ Р·Р°РїРёСЃСЊ
          </Button>
          <Button
            variant="pill-outline"
            size="lg"
            className="w-full"
            onClick={() => {
              releaseLock(lockKey);
              onSlotLost();
            }}
          >
            РћС‚РјРµРЅРёС‚СЊ Рё РІС‹Р±СЂР°С‚СЊ РґСЂСѓРіРѕРµ РІСЂРµРјСЏ
          </Button>
        </div>
      ) : (
        <Button variant="pill-accent" size="lg" className="w-full" onClick={onSlotLost}>
          Р’С‹Р±СЂР°С‚СЊ РґСЂСѓРіРѕРµ РІСЂРµРјСЏ
        </Button>
      )}
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-pill bg-accent/15 text-accent [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wider text-bg-ivory/50">
          {label}
        </p>
        <p className="text-[15px] font-semibold">{value}</p>
        {sub && <p className="text-[12px] text-bg-ivory/60">{sub}</p>}
      </div>
    </div>
  );
}

function SuccessStep({
  services,
  branch,
  date,
  time,
}: {
  services: import("@/lib/store").Service[];
  branch?: import("@/lib/store").Branch;
  date?: string;
  time?: string;
}) {
  const summary =
    services.length === 1
      ? services[0].title
      : `${services[0]?.title ?? ""} +${services.length - 1}`;

  return (
    <div className="flex flex-col items-center pt-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent/40 blur-3xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>
      </div>

      <h2 className="mt-6 text-[28px] font-bold leading-tight">
        Р—Р°РїРёСЃСЊ <span className="font-serif-italic text-accent">РїСЂРёРЅСЏС‚Р°</span>
      </h2>
      <p className="mt-2 max-w-xs text-[14px] text-bg-ivory/70">
        РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ Рё РЅР°РїРѕРјРёРЅР°РЅРёРµ РїСЂРёРґСѓС‚ РІ Telegram. Р‘СѓРґРµРј Р¶РґР°С‚СЊ!
      </p>

      {services.length > 0 && branch && date && time && (
        <div className="mt-6 w-full rounded-[24px] glass-card p-4 text-left">
          <p className="text-[15px] font-semibold">{summary}</p>
          <p className="mt-1 text-[12px] text-bg-ivory/60">
            {branch.name} В· {new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} РІ {time}
          </p>
        </div>
      )}

      <div className="mt-6 flex w-full gap-2">
        <Button asChild variant="pill-outline" size="lg" className="flex-1">
          <Link to="/profile">РњРѕРё Р·Р°РїРёСЃРё</Link>
        </Button>
        <Button asChild variant="pill-accent" size="lg" className="flex-1">
          <Link to="/">РќР° РіР»Р°РІРЅСѓСЋ</Link>
        </Button>
      </div>
    </div>
  );
}

// silence unused warnings for icons rendered conditionally
void Phone;
void Clock;
