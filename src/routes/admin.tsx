import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useStore,
  branchActions,
  serviceActions,
  masterActions,
  promoActions,
  resetStore,
  type Branch,
  type Service,
  type Master,
  type Promo,
} from "@/lib/store";
import {
  useAllBookingsAdmin,
  useSetBookingStatus,
  useCancelBooking,
  type ClientBooking,
  type BookingStatus,
} from "@/lib/bookings-client";
import {
  useAdminCustomers,
  useAdminCustomerDetail,
  useSetCustomerNote,
  useCreateAdminBooking,
  useAdminSetBookingStatus,
} from "@/lib/admin-client";
import {
  useBroadcast,
  useExportBookings,
  useExportCustomers,
  downloadCsv,
} from "@/lib/batch2-client";
import {
  useAllReviewsAdmin,
  useModerateReview,
  useReplyToReview,
  useMasterEarnings,
} from "@/lib/batch3-client";
import {
  useAdminCerts,
  useCreateCert,
  useRevokeCert,
  useAdminPackages,
  useCreatePackage,
  useRevokePackage,
} from "@/lib/batch4-client";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

type Booking = ClientBooking;
import { categories, formatSum } from "@/lib/mock";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админка — Bravo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

import { useTelegramAuth, getTelegramWebApp } from "@/lib/telegram-client";
import { setAdminPass, getAdminPass } from "@/lib/admin-creds";
import {
  getAdminToken,
  setAdminToken,
  getCachedAdmin,
  setCachedAdmin,
  clearAdminSession,
} from "@/lib/admin-session";
import {
  adminLoginFn,
  adminLogoutFn,
  listAdminsFn,
  createAdminFn,
  deleteAdminFn,
  updateAdminFn,
} from "@/lib/admins-fn";
import type { Admin, AdminRole } from "@/lib/server/admin-db";

function AdminPage() {
  const { loading, result } = useTelegramAuth();
  const [passUnlocked, setPassUnlocked] = useState(false);
  const [sessionAdmin, setSessionAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPassUnlocked(!!getAdminPass());
    setSessionAdmin(getCachedAdmin());
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-deep text-bg-ivory">
        <div className="text-[14px] text-bg-ivory/60">Проверка доступа…</div>
      </main>
    );
  }

  if (result?.isAdmin || passUnlocked || sessionAdmin) {
    return <AdminShell currentAdmin={sessionAdmin} />;
  }
  return (
    <AccessDenied
      result={result}
      onPassUnlock={() => setPassUnlocked(true)}
      onSessionLogin={(a) => setSessionAdmin(a)}
    />
  );
}

function AccessDenied({
  result,
  onPassUnlock,
  onSessionLogin,
}: {
  result: { ok: boolean; user: { id: number; first_name?: string } | null } | null;
  onPassUnlock: () => void;
  onSessionLogin: (a: Admin) => void;
}) {
  const unsafeUser = getTelegramWebApp()?.initDataUnsafe?.user;
  const userId = result?.user?.id ?? unsafeUser?.id;
  const firstName = result?.user?.first_name ?? unsafeUser?.first_name;
  const [login, setLogin] = useState("admin");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !pass) {
      setErr("Введите логин и пароль");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const r = await adminLoginFn({ data: { login: login.trim(), password: pass } });
      if (r.ok) {
        setAdminToken(r.token);
        setCachedAdmin(r.admin);
        onSessionLogin(r.admin);
        return;
      }
      // Fallback: maybe user typed the old env ADMIN_PASSWORD — try password path.
      setAdminPass(pass);
      onPassUnlock();
    } catch (e) {
      setErr((e as Error)?.message ?? "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-deep px-5 py-10 text-bg-ivory">
      <div className="w-full max-w-sm space-y-4 rounded-[24px] bg-bg-ivory/5 p-6">
        <div className="text-center">
          <span className="caption text-accent">Bravo Admin</span>
          <h1 className="text-[22px] font-bold">Вход в админку</h1>
        </div>

        {userId && !result?.isAdmin && (
          <div className="rounded-[16px] bg-bg-ivory/10 p-3 text-left">
            <p className="text-[12px] text-bg-ivory/70">
              Вы открыли админку как <b>{firstName ?? "пользователь"}</b>
              {result?.ok ? " (Telegram ✓)" : ""}. Войдите ниже.
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-bg-ivory/50">
              Ваш Telegram ID
            </p>
            <p className="mt-1 font-mono text-[14px] font-bold text-accent">
              {userId}
            </p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <Input
            type="text"
            value={login}
            onChange={(e) => {
              setLogin(e.target.value);
              setErr("");
            }}
            placeholder="Логин"
            autoComplete="username"
          />
          <Input
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setErr("");
            }}
            placeholder="Пароль"
            autoComplete="current-password"
            autoFocus
          />
          {err && <p className="text-[12px] text-red-400 text-center">{err}</p>}
          <Button type="submit" variant="pill-accent" className="w-full" disabled={busy}>
            {busy ? "Вход…" : "Войти"}
          </Button>
        </form>

        <p className="text-center text-[11px] text-bg-ivory/45">
          По умолчанию: логин <b>admin</b>, пароль = значение секрета <code>ADMIN_PASSWORD</code>.
        </p>

        <Link
          to="/"
          className="block text-center text-[13px] text-bg-ivory/60 hover:text-bg-ivory"
        >
          ← На главную
        </Link>
      </div>
    </main>
  );
}

function AdminShell({ currentAdmin }: { currentAdmin: Admin | null }) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const exportBookingsMut = useExportBookings();
  const exportCustomersMut = useExportCustomers();
  const isSuper = !currentAdmin || currentAdmin.role === "super";

  const handleLogout = async () => {
    const token = getAdminToken();
    if (token) {
      try { await adminLogoutFn({ data: { token } }); } catch {}
    }
    clearAdminSession();
    // Also clear legacy env-password fallback so we don't stay "unlocked".
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lume_admin_pass_v1");
      } catch {}
      window.location.reload();
    }
  };

  const doExport = async (kind: "bookings" | "customers") => {
    const mut = kind === "bookings" ? exportBookingsMut : exportCustomersMut;
    const r = await mut.mutateAsync();
    if (r.ok && r.csv) {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(r.csv, `bravo-${kind}-${stamp}.csv`);
    }
  };

  return (
    <main className="min-h-screen bg-bg-deep text-bg-ivory">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-bg-ivory/10 bg-bg-deep/95 px-3 py-3 md:px-5 md:py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-bg-ivory/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="caption text-accent">Bravo</span>
            <h1 className="text-[16px] md:text-[18px] font-bold leading-tight">
              Админ-панель
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBroadcastOpen(true)}
            className="text-bg-ivory/80 hover:text-bg-ivory border border-bg-ivory/15"
            title="Массовая рассылка всем клиентам через бота"
          >
            📣 <span className="hidden md:inline ml-1">Рассылка</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => doExport("bookings")}
            disabled={exportBookingsMut.isPending}
            className="text-bg-ivory/80 hover:text-bg-ivory border border-bg-ivory/15"
            title="Экспорт всех записей в CSV"
          >
            ⇣ <span className="hidden md:inline ml-1">CSV</span>
          </Button>
          {isSuper && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Сбросить все данные к исходным?")) resetStore();
              }}
              className="text-bg-ivory/70 hover:text-bg-ivory border border-bg-ivory/15"
              title="Сброс данных"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Выйти из админ-панели?")) handleLogout();
            }}
            className="border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
            title="Выйти"
          >
            <LogOut className="h-4 w-4 md:mr-1" />
            <span className="hidden md:inline">Выйти</span>
          </Button>
        </div>
      </header>
      <BroadcastDialog open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />

      <div className="mx-auto max-w-6xl p-3 md:p-5">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="-mx-3 flex w-[calc(100%+1.5rem)] gap-1 overflow-x-auto bg-bg-ivory/5 px-3 md:mx-0 md:w-full md:flex-wrap md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="dashboard" className="shrink-0">Дашборд</TabsTrigger>
            <TabsTrigger value="calendar" className="shrink-0">Календарь</TabsTrigger>
            <TabsTrigger value="bookings" className="shrink-0">Записи</TabsTrigger>
            {isSuper && <TabsTrigger value="customers" className="shrink-0">Клиенты</TabsTrigger>}
            {isSuper && <TabsTrigger value="reviews" className="shrink-0">Отзывы</TabsTrigger>}
            {isSuper && <TabsTrigger value="earnings" className="shrink-0">Доходы</TabsTrigger>}
            {isSuper && <TabsTrigger value="certs" className="shrink-0">Ваучеры</TabsTrigger>}
            {isSuper && <TabsTrigger value="packages" className="shrink-0">Абонементы</TabsTrigger>}
            {isSuper && <TabsTrigger value="branches" className="shrink-0">Филиалы</TabsTrigger>}
            {isSuper && <TabsTrigger value="services" className="shrink-0">Услуги</TabsTrigger>}
            {isSuper && <TabsTrigger value="masters" className="shrink-0">Мастера</TabsTrigger>}
            {isSuper && <TabsTrigger value="promos" className="shrink-0">Акции</TabsTrigger>}
            {isSuper && <TabsTrigger value="staff" className="shrink-0">Сотрудники</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard" className="mt-5">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="calendar" className="mt-5">
            <DayCalendarTab />
          </TabsContent>
          <TabsContent value="bookings" className="mt-5">
            <BookingsTab />
          </TabsContent>
          <TabsContent value="certs" className="mt-5">
            <CertsTab />
          </TabsContent>
          <TabsContent value="packages" className="mt-5">
            <PackagesTab />
          </TabsContent>
          <TabsContent value="customers" className="mt-5">
            <CustomersTab />
          </TabsContent>
          <TabsContent value="reviews" className="mt-5">
            <ReviewsTab />
          </TabsContent>
          <TabsContent value="earnings" className="mt-5">
            <EarningsTab />
          </TabsContent>
          <TabsContent value="branches" className="mt-5">
            <BranchesTab />
          </TabsContent>
          <TabsContent value="services" className="mt-5">
            <ServicesTab />
          </TabsContent>
          <TabsContent value="masters" className="mt-5">
            <MastersTab />
          </TabsContent>
          <TabsContent value="promos" className="mt-5">
            <PromosTab />
          </TabsContent>
          <TabsContent value="staff" className="mt-5">
            <StaffTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

/* ---------- Dashboard ---------- */

function DashboardTab() {
  const { branches, services, masters, promos } = useStore();
  const { data: bookings } = useAllBookingsAdmin();

  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.price, 0);
  const revenueCompleted = completed.reduce((s, b) => s + b.price, 0);

  // Today's bookings.
  const todayISO = new Date().toISOString().slice(0, 10);
  const todayBookings = bookings.filter((b) => b.startAt.startsWith(todayISO));

  // Next 7 days revenue (upcoming + confirmed).
  const in7days = bookings.filter((b) => {
    const d = new Date(b.startAt);
    const now = Date.now();
    return (
      b.status !== "cancelled" &&
      d.getTime() >= now &&
      d.getTime() <= now + 7 * 24 * 60 * 60 * 1000
    );
  });

  const stats = [
    { label: "Сегодня", value: todayBookings.length, accent: true },
    { label: "Ожидают", value: upcoming.length },
    { label: "Подтверждено", value: confirmed.length },
    { label: "Завершено", value: completed.length },
    { label: "Отменено", value: cancelled.length },
    { label: "Всего записей", value: bookings.length },
  ];

  const catalog = [
    { label: "Филиалов", value: branches.length },
    { label: "Услуг", value: services.length },
    { label: "Мастеров", value: masters.length },
    { label: "Акций", value: promos.length },
  ];

  return (
    <div className="space-y-4 text-bg-ivory">
      {/* Revenue hero */}
      <div className="rounded-[20px] bg-gradient-to-br from-accent/20 to-bg-ivory/5 border border-accent/20 p-4 md:p-5">
        <p className="text-[11px] uppercase tracking-wider text-bg-ivory/60">
          Выручка (без отменённых)
        </p>
        <p className="mt-1 text-[28px] md:text-[36px] font-bold text-accent leading-none">
          {formatSum(revenue)}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-[12px] bg-bg-deep/40 p-2">
            <p className="text-bg-ivory/50">Завершено</p>
            <p className="mt-0.5 font-semibold text-bg-ivory">
              {formatSum(revenueCompleted)}
            </p>
          </div>
          <div className="rounded-[12px] bg-bg-deep/40 p-2">
            <p className="text-bg-ivory/50">Ближайшие 7 дней</p>
            <p className="mt-0.5 font-semibold text-bg-ivory">
              {in7days.length} записей
            </p>
          </div>
        </div>
      </div>

      {/* Booking status cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-[14px] border p-3 ${
              s.accent
                ? "border-accent/30 bg-accent/15"
                : "border-bg-ivory/10 bg-bg-ivory/5"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wide text-bg-ivory/60 leading-tight">
              {s.label}
            </p>
            <p
              className={`mt-1 text-[22px] md:text-[26px] font-bold leading-none ${
                s.accent ? "text-accent" : "text-bg-ivory"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Catalog counts */}
      <div className="grid grid-cols-4 gap-2">
        {catalog.map((c) => (
          <div
            key={c.label}
            className="rounded-[14px] border border-bg-ivory/10 bg-bg-ivory/5 p-3"
          >
            <p className="text-[10px] uppercase tracking-wide text-bg-ivory/60 leading-tight">
              {c.label}
            </p>
            <p className="mt-1 text-[20px] font-bold text-bg-ivory leading-none">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Today's schedule */}
      {todayBookings.length > 0 && (
        <div className="rounded-[20px] border border-bg-ivory/10 bg-bg-ivory/5 p-4">
          <p className="text-[11px] uppercase tracking-wider text-bg-ivory/60 mb-3">
            Сегодня · {todayBookings.length} записей
          </p>
          <div className="space-y-2">
            {todayBookings
              .sort((a, b) => a.startAt.localeCompare(b.startAt))
              .map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-[12px] bg-bg-deep/40 p-3 text-[13px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-bg-ivory truncate">
                      {b.serviceTitle}
                    </p>
                    <p className="text-[11px] text-bg-ivory/60 truncate">
                      {b.customerName ?? "—"} · {b.masterName}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-mono text-accent font-semibold">
                      {b.startAt.slice(11, 16)}
                    </p>
                    <StatusPill status={b.status} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Revenue charts */}
      <RevenueCharts bookings={bookings} />

      {/* Master workload */}
      <div className="rounded-[20px] border border-bg-ivory/10 bg-bg-ivory/5 p-4">
        <p className="text-[11px] uppercase tracking-wider text-bg-ivory/60 mb-3">
          Загрузка мастеров
        </p>
        <div className="space-y-2">
          {masters.map((m) => {
            const count = bookings.filter(
              (b) => b.masterName === m.name && b.status !== "cancelled",
            ).length;
            return (
              <div
                key={m.id}
                className="flex items-center justify-between text-[14px] text-bg-ivory"
              >
                <span className="font-medium">{m.name}</span>
                <span className="rounded-pill bg-accent/15 px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Booking["status"] }) {
  const map: Record<Booking["status"], { label: string; cls: string }> = {
    upcoming: { label: "ждёт", cls: "bg-bg-ivory/15 text-bg-ivory/80" },
    confirmed: { label: "✓", cls: "bg-accent/20 text-accent" },
    completed: { label: "готово", cls: "bg-emerald-500/15 text-emerald-400" },
    cancelled: { label: "отмена", cls: "bg-red-500/15 text-red-400" },
    no_show: { label: "не пришёл", cls: "bg-orange-500/15 text-orange-400" },
  };
  const x = map[status] ?? map.upcoming;
  return (
    <span
      className={`inline-block rounded-pill px-2 py-0.5 text-[10px] font-semibold ${x.cls}`}
    >
      {x.label}
    </span>
  );
}

/* ---------- Bookings ---------- */

type SortKey = "date-desc" | "date-asc" | "master" | "service";

const PAGE_SIZE = 20;

const STATUS_LABEL: Record<Booking["status"], string> = {
  upcoming: "Ожидают",
  confirmed: "Подтверждённые",
  completed: "Завершённые",
  cancelled: "Отменённые",
  no_show: "Не пришли",
};
const STATUS_ORDER: Booking["status"][] = [
  "upcoming",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function BookingsTab() {
  const { data: bookings, isLoading: bookingsLoading } = useAllBookingsAdmin();
  const statusMut = useSetBookingStatus();
  const adminStatusMut = useAdminSetBookingStatus();
  const cancelMut = useCancelBooking();
  const [filter, setFilter] = useState<Booking["status"] | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [page, setPage] = useState(1);
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{ id: string } | null>(null);

  // Wrap status changes to support no-show via adminFn (which also notifies user
  // when applicable). Status changes for "completed" still go through standard
  // mutation so bonuses get accrued.
  const handleSetStatus = (id: string, status: BookingStatus) => {
    if (status === "no_show") {
      adminStatusMut.mutate({ id, status });
    } else if (status === "cancelled") {
      setCancelDialog({ id });
    } else {
      statusMut.mutate({ id, status });
    }
  };
  const handleCancel = (id: string) => setCancelDialog({ id });

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleMany = (ids: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) ids.forEach((id) => next.add(id));
      else ids.forEach((id) => next.delete(id));
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  const bulkSetStatus = (status: BookingStatus) => {
    selected.forEach((id) => statusMut.mutate({ id, status }));
    clearSelection();
  };
  const bulkDelete = () => {
    if (!confirm(`Отменить ${selected.size} запис${selected.size === 1 ? "ь" : "ей"}?`)) return;
    selected.forEach((id) => cancelMut.mutate(id));
    clearSelection();
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
    if (needle) {
      list = list.filter(
        (b) =>
          b.masterName.toLowerCase().includes(needle) ||
          b.serviceTitle.toLowerCase().includes(needle) ||
          b.branchName.toLowerCase().includes(needle)
      );
    }
    if (from) {
      const fromMs = new Date(from).setHours(0, 0, 0, 0);
      list = list.filter((b) => +new Date(b.startAt) >= fromMs);
    }
    if (to) {
      const toMs = new Date(to).setHours(23, 59, 59, 999);
      list = list.filter((b) => +new Date(b.startAt) <= toMs);
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return +new Date(a.startAt) - +new Date(b.startAt);
        case "master":
          return a.masterName.localeCompare(b.masterName, "ru");
        case "service":
          return a.serviceTitle.localeCompare(b.serviceTitle, "ru");
        case "date-desc":
        default:
          return +new Date(b.startAt) - +new Date(a.startAt);
      }
    });
    return sorted;
  }, [bookings, filter, q, sort, from, to]);

  // Reset page when filters change result set size
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);
  useEffect(() => {
    setPage(1);
  }, [filter, q, sort, from, to]);

  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const setQuickRange = (days: number) => {
    const t = new Date();
    const f = new Date();
    f.setDate(t.getDate() - days + 1);
    setFrom(f);
    setTo(t);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[18px] font-bold text-bg-ivory">Записи</h2>
        <Button
          size="sm"
          variant="pill-accent"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" /> Создать
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "upcoming", "confirmed", "completed", "cancelled", "no_show"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "pill-accent" : "pill-outline"}
            onClick={() => setFilter(s)}
            disabled={groupByStatus && s !== "all"}
            className={filter === s ? "" : "text-bg-ivory"}
          >
            {s === "all" ? "Все" : STATUS_LABEL[s]}
          </Button>
        ))}
        <Button
          size="sm"
          variant={groupByStatus ? "pill-accent" : "pill-outline"}
          onClick={() => {
            setGroupByStatus((v) => !v);
            setFilter("all");
          }}
          className={groupByStatus ? "" : "text-bg-ivory"}
        >
          Группировать по статусу
        </Button>
        <div className="ml-auto flex w-full md:w-auto flex-wrap items-center gap-2">
          <Input
            placeholder="Поиск по мастеру, услуге, филиалу"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full md:w-[260px] bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory placeholder:text-bg-ivory/40"
          />
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-9 w-[170px] md:w-[200px] bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Дата ↓ (новые)</SelectItem>
              <SelectItem value="date-asc">Дата ↑ (старые)</SelectItem>
              <SelectItem value="master">По мастеру</SelectItem>
              <SelectItem value="service">По услуге</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[12px] text-bg-ivory/50 ml-auto md:ml-0">
            {filtered.length} из {bookings.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DatePickerButton label="С" value={from} onChange={setFrom} />
        <DatePickerButton label="По" value={to} onChange={setTo} disabled={(d) => (from ? d < from : false)} />
        <Button size="sm" variant="pill-outline" className="text-bg-ivory" onClick={() => setQuickRange(7)}>
          7 дней
        </Button>
        <Button size="sm" variant="pill-outline" className="text-bg-ivory" onClick={() => setQuickRange(30)}>
          30 дней
        </Button>
        {(from || to) && (
          <Button
            size="sm"
            variant="ghost"
            className="text-bg-ivory/70"
            onClick={() => {
              setFrom(undefined);
              setTo(undefined);
            }}
          >
            <X className="h-4 w-4" /> Сбросить даты
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-accent/40 bg-accent/10 px-3 py-2">
          <span className="text-[13px] text-bg-ivory">
            Выбрано: {selected.size}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="pill-outline" className="text-bg-ivory" onClick={() => bulkSetStatus("upcoming")}>
              В «Предстоит»
            </Button>
            <Button size="sm" variant="pill-outline" className="text-bg-ivory" onClick={() => bulkSetStatus("completed")}>
              Завершить
            </Button>
            <Button size="sm" variant="pill-outline" className="text-bg-ivory" onClick={() => bulkSetStatus("cancelled")}>
              Отменить
            </Button>
            <Button size="sm" variant="destructive" onClick={bulkDelete}>
              <Trash2 className="h-4 w-4" /> Удалить
            </Button>
            <Button size="sm" variant="ghost" className="text-bg-ivory/70" onClick={clearSelection}>
              Снять выбор
            </Button>
          </div>
        </div>
      )}

      {groupByStatus ? (
        <div className="space-y-4">
          {STATUS_ORDER.map((status) => {
            const items = filtered.filter((b) => b.status === status);
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-bg-ivory">
                    {STATUS_LABEL[status]}{" "}
                    <span className="text-bg-ivory/50">({items.length})</span>
                  </h3>
                </div>
                <BookingsTable
                  items={items}
                  selected={selected}
                  onToggleOne={toggleOne}
                  onToggleMany={toggleMany}
                  onSetStatus={handleSetStatus}
                  onCancel={handleCancel}
                  emptyText={`Нет записей в категории «${STATUS_LABEL[status]}»`}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <BookingsTable
            items={pageItems}
            selected={selected}
            onToggleOne={toggleOne}
            onToggleMany={toggleMany}
            onSetStatus={handleSetStatus}
            onCancel={handleCancel}
          />
          <div className="flex items-center justify-between text-[13px] text-bg-ivory/70">
            <span>
              Стр. {safePage} из {totalPages} · показано{" "}
              {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CreateBookingDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <CancelReasonDialog
        open={cancelDialog !== null}
        onClose={() => setCancelDialog(null)}
        onConfirm={(reason) => {
          if (cancelDialog) {
            adminStatusMut.mutate({
              id: cancelDialog.id,
              status: "cancelled",
              cancelReason: reason,
            });
            setCancelDialog(null);
          }
        }}
      />
    </div>
  );
}

const CANCEL_REASONS = [
  "Клиент не отвечает",
  "Конфликт по времени",
  "Болезнь клиента",
  "Болезнь мастера",
  "По просьбе клиента",
  "Другое",
];

function CancelReasonDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    if (open) {
      setReason(CANCEL_REASONS[0]);
      setCustom("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bg-deep text-bg-ivory border-bg-ivory/15 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bg-ivory">Причина отмены</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full rounded-[12px] border px-3 py-2 text-left text-[13px] transition-colors ${
                reason === r
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-bg-ivory/15 bg-bg-ivory/5 text-bg-ivory hover:bg-bg-ivory/10"
              }`}
            >
              {r}
            </button>
          ))}
          {reason === "Другое" && (
            <Textarea
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Опишите причину…"
              rows={2}
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Не отменять
          </Button>
          <Button
            variant="pill-accent"
            onClick={() => {
              const finalReason = reason === "Другое" ? custom.trim() || "Другое" : reason;
              onConfirm(finalReason);
            }}
          >
            Отменить запись
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateBookingDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { branches, services, masters } = useStore();
  const createMut = useCreateAdminBooking();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [branchId, setBranchId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [masterId, setMasterId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("12:00");

  useEffect(() => {
    if (open) {
      setCustomerName("");
      setCustomerPhone("");
      setBranchId(branches[0]?.id ?? "");
      setServiceId(services[0]?.id ?? "");
      setMasterId("");
      setDate(new Date().toISOString().slice(0, 10));
      setTime("12:00");
    }
  }, [open, branches, services]);

  const service = services.find((s) => s.id === serviceId);
  const branch = branches.find((b) => b.id === branchId);
  const master = masters.find((m) => m.id === masterId);
  const availableMasters = serviceId
    ? masters.filter(
        (m) =>
          m.serviceIds.includes(serviceId) &&
          (!branchId || m.branchIds.includes(branchId)),
      )
    : masters;

  const submit = async () => {
    if (!service || !branch) return;
    if (!customerName.trim()) {
      alert("Укажите имя клиента");
      return;
    }
    const r = await createMut.mutateAsync({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      serviceTitle: service.title,
      serviceIds: [service.id],
      masterId: master?.id,
      masterName: master?.name ?? "Любой свободный",
      branchId: branch.id,
      branchName: branch.name,
      startAt: `${date}T${time}:00`,
      durationMin: service.durationMin,
      price: service.price,
    });
    if (r.ok) onClose();
    else alert(r.error ?? "Не удалось создать запись");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-bg-deep text-bg-ivory border-bg-ivory/15 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bg-ivory">Создать запись</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Имя клиента *">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Имя или 'Walk-in'"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Телефон">
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Филиал">
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Услуга">
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Мастер (опционально)">
            <Select value={masterId || "any"} onValueChange={(v) => setMasterId(v === "any" ? "" : v)}>
              <SelectTrigger className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Любой свободный</SelectItem>
                {availableMasters.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Дата">
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
              />
            </Field>
            <Field label="Время">
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
              />
            </Field>
          </div>
          {service && (
            <div className="rounded-[12px] bg-bg-ivory/5 p-3 text-[13px]">
              <p>Длительность: {service.durationMin} мин</p>
              <p>Стоимость: <b className="text-accent">{formatSum(service.price)}</b></p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button variant="pill-accent" onClick={submit} disabled={createMut.isPending}>
            {createMut.isPending ? "..." : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingsTable({
  items,
  selected,
  onToggleOne,
  onToggleMany,
  onSetStatus,
  onCancel,
  emptyText = "Нет записей",
}: {
  items: Booking[];
  selected: Set<string>;
  onToggleOne: (id: string) => void;
  onToggleMany: (ids: string[], checked: boolean) => void;
  onSetStatus: (id: string, status: BookingStatus) => void;
  onCancel: (id: string) => void;
  emptyText?: string;
}) {
  const ids = items.map((b) => b.id);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
  const someChecked = !allChecked && ids.some((id) => selected.has(id));
  return (
    <>
      {/* Mobile: card view */}
      <div className="md:hidden space-y-2">
        {items.length === 0 && (
          <p className="text-center text-bg-ivory/50 py-6 text-[13px]">{emptyText}</p>
        )}
        {items.map((b) => (
          <div
            key={b.id}
            className={`rounded-[16px] border p-3 ${
              selected.has(b.id)
                ? "border-accent bg-accent/5"
                : "border-bg-ivory/10 bg-bg-ivory/5"
            }`}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={selected.has(b.id)}
                onCheckedChange={() => onToggleOne(b.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-bg-ivory truncate text-[14px]">
                    {b.serviceTitle}
                  </p>
                  <StatusPill status={b.status} />
                </div>
                <p className="text-[12px] text-bg-ivory/70 mt-0.5">
                  <span className="text-bg-ivory">
                    {b.customerName ?? "—"}
                  </span>
                  {b.customerUsername && (
                    <span className="text-bg-ivory/50"> · @{b.customerUsername}</span>
                  )}
                </p>
                <p className="text-[11px] text-bg-ivory/60 mt-0.5">
                  {b.masterName} · {b.branchName}
                </p>
                <p className="text-[11px] text-bg-ivory/60 mt-0.5">
                  {new Date(b.startAt).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}
                  {" · "}
                  <span className="text-accent font-semibold">{formatSum(b.price)}</span>
                </p>
                <div className="mt-2">
                  <BookingActionButtons
                    booking={b}
                    onSetStatus={onSetStatus}
                    onCancel={onCancel}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block overflow-x-auto rounded-[20px] border border-bg-ivory/10 bg-bg-ivory/5">
      <Table>
        <TableHeader>
          <TableRow className="border-bg-ivory/10 hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={allChecked ? true : someChecked ? "indeterminate" : false}
                onCheckedChange={(v) => onToggleMany(ids, v === true)}
                disabled={ids.length === 0}
              />
            </TableHead>
            <TableHead className="text-bg-ivory/60">Клиент</TableHead>
            <TableHead className="text-bg-ivory/60">Услуга</TableHead>
            <TableHead className="text-bg-ivory/60">Мастер</TableHead>
            <TableHead className="text-bg-ivory/60">Филиал</TableHead>
            <TableHead className="text-bg-ivory/60">Когда</TableHead>
            <TableHead className="text-bg-ivory/60">Цена</TableHead>
            <TableHead className="text-bg-ivory/60">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-bg-ivory/50 py-8">
                {emptyText}
              </TableCell>
            </TableRow>
          )}
          {items.map((b) => (
            <TableRow key={b.id} className="border-bg-ivory/10" data-state={selected.has(b.id) ? "selected" : undefined}>
              <TableCell>
                <Checkbox
                  checked={selected.has(b.id)}
                  onCheckedChange={() => onToggleOne(b.id)}
                />
              </TableCell>
              <TableCell>
                <div className="min-w-[140px]">
                  <p className="font-semibold text-bg-ivory">{b.customerName ?? "—"}</p>
                  <p className="text-[11px] text-bg-ivory/55">
                    {b.customerUsername ? `@${b.customerUsername}` : `ID ${b.tgUserId ?? "?"}`}
                  </p>
                </div>
              </TableCell>
              <TableCell className="font-medium">{b.serviceTitle}</TableCell>
              <TableCell>{b.masterName}</TableCell>
              <TableCell>{b.branchName}</TableCell>
              <TableCell>
                {new Date(b.startAt).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </TableCell>
              <TableCell className="text-accent">{formatSum(b.price)}</TableCell>
              <TableCell>
                <BookingActionButtons
                  booking={b}
                  onSetStatus={onSetStatus}
                  onCancel={onCancel}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}

function BookingActionButtons({
  booking,
  onSetStatus,
  onCancel,
}: {
  booking: Booking;
  onSetStatus: (id: string, status: BookingStatus) => void;
  onCancel: (id: string) => void;
}) {
  const isPending = booking.status === "upcoming";
  const isConfirmed = booking.status === "confirmed";
  const isDone = booking.status === "completed" || booking.status === "cancelled";

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="md:inline hidden">
        <StatusPill status={booking.status} />
      </span>
      {!isDone && (
        <>
          {isPending && (
            <button
              type="button"
              onClick={() => onSetStatus(booking.id, "confirmed")}
              className="rounded-pill bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent hover:bg-accent/25"
              title="Подтвердить"
            >
              ✓
            </button>
          )}
          {(isPending || isConfirmed) && (
            <button
              type="button"
              onClick={() => onSetStatus(booking.id, "completed")}
              className="rounded-pill bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/25"
              title="Завершить (начисляет бонусы)"
            >
              ✓ Завершить
            </button>
          )}
          {(isPending || isConfirmed) && (
            <button
              type="button"
              onClick={() => onSetStatus(booking.id, "no_show")}
              className="rounded-pill bg-orange-500/15 px-2.5 py-1 text-[11px] font-semibold text-orange-400 hover:bg-orange-500/25"
              title="Клиент не пришёл"
            >
              ⊘
            </button>
          )}
          <button
            type="button"
            onClick={() => onCancel(booking.id)}
            className="rounded-pill bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25"
            title="Отменить с указанием причины"
          >
            ✕
          </button>
        </>
      )}
    </div>
  );
}

function DatePickerButton({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value?: Date;
  onChange: (d: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 justify-start gap-2 font-normal border-bg-ivory/15 bg-bg-ivory/5 text-bg-ivory hover:bg-bg-ivory/10 hover:text-bg-ivory",
            !value && "text-bg-ivory/50"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {label}: {value ? format(value, "d MMM yyyy", { locale: ru }) : "—"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabled}
          initialFocus
          locale={ru}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}


/* ---------- Branches ---------- */

function BranchesTab() {
  const { branches } = useStore();
  const [editing, setEditing] = useState<Branch | null>(null);
  const [open, setOpen] = useState(false);

  const blank: Omit<Branch, "id"> = {
    name: "",
    address: "",
    phone: "",
    hours: "Пн–Вс · 10:00–22:00",
    image: branches[0]?.image ?? "",
    distanceKm: 0,
    nameUz: "",
    addressUz: "",
    hoursUz: "",
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="pill-accent"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Добавить филиал
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {branches.map((b) => (
          <Card key={b.id} className="bg-bg-ivory/5 border-bg-ivory/10 overflow-hidden">
            <img src={b.image} alt={b.name} loading="lazy" className="aspect-[16/8] w-full object-cover" />
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-bg-ivory">{b.name}</h3>
                  <p className="text-[13px] text-bg-ivory/60">{b.address}</p>
                  <p className="text-[12px] text-bg-ivory/50">
                    {b.phone} · {b.hours} · {b.distanceKm} км
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-bg-ivory/80 hover:bg-bg-ivory/10 hover:text-bg-ivory border border-bg-ivory/15"
                    onClick={() => {
                      setEditing(b);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-400/90 hover:bg-red-500/10 hover:text-red-300 border border-red-500/30"
                    onClick={() => {
                      if (confirm(`Удалить ${b.name}?`)) branchActions.remove(b.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BranchDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? blank}
        editingId={editing?.id}
      />
    </div>
  );
}

function BranchDialog({
  open,
  onOpenChange,
  initial,
  editingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Omit<Branch, "id"> | Branch;
  editingId?: string;
}) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редактировать филиал" : "Новый филиал"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Название">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Адрес">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Телефон">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Часы работы">
            <Input
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
            />
          </Field>
          <Field label="Расстояние (км)">
            <Input
              type="number"
              step="0.1"
              value={form.distanceKm}
              onChange={(e) =>
                setForm({ ...form, distanceKm: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>
          <ImageUpload
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            folder="branches"
            label="Фото филиала"
          />

          <details className="rounded-md border border-bg-ivory/15 bg-bg-ivory/5 p-2">
            <summary className="cursor-pointer text-[13px] font-medium text-bg-ivory/80">
              🇺🇿 Перевод на узбекский (необязательно)
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Название (UZ)">
                <Input
                  value={form.nameUz ?? ""}
                  onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                  placeholder="Bravo Yunusobod"
                />
              </Field>
              <Field label="Адрес (UZ)">
                <Input
                  value={form.addressUz ?? ""}
                  onChange={(e) => setForm({ ...form, addressUz: e.target.value })}
                  placeholder="Amir Temur ko'chasi, 12"
                />
              </Field>
              <Field label="Часы (UZ)">
                <Input
                  value={form.hoursUz ?? ""}
                  onChange={(e) => setForm({ ...form, hoursUz: e.target.value })}
                  placeholder="Du–Yak · 09:00–22:00"
                />
              </Field>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (!form.name.trim()) return;
              if (editingId) branchActions.update(editingId, form);
              else branchActions.add(form);
              onOpenChange(false);
            }}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Services ---------- */

function ServicesTab() {
  const { services } = useStore();
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);

  const blank: Omit<Service, "id"> = {
    title: "",
    category: "manicure",
    durationMin: 60,
    price: 100000,
    image: services[0]?.image ?? "",
    description: "",
    popular: false,
    titleUz: "",
    descriptionUz: "",
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="pill-accent"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Добавить услугу
        </Button>
      </div>

      <div className="overflow-hidden rounded-[20px] border border-bg-ivory/10 bg-bg-ivory/5">
        <Table>
          <TableHeader>
            <TableRow className="border-bg-ivory/10 hover:bg-transparent">
              <TableHead className="text-bg-ivory/60">Название</TableHead>
              <TableHead className="text-bg-ivory/60">Категория</TableHead>
              <TableHead className="text-bg-ivory/60">Длит.</TableHead>
              <TableHead className="text-bg-ivory/60">Цена</TableHead>
              <TableHead className="text-bg-ivory/60">Топ</TableHead>
              <TableHead className="text-bg-ivory/60 text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((s) => (
              <TableRow key={s.id} className="border-bg-ivory/10">
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell>{s.category}</TableCell>
                <TableCell>{s.durationMin} мин</TableCell>
                <TableCell className="text-accent">{formatSum(s.price)}</TableCell>
                <TableCell>{s.popular ? "★" : "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-bg-ivory/80 hover:bg-bg-ivory/10 hover:text-bg-ivory border border-bg-ivory/15"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-400/90 hover:bg-red-500/10 hover:text-red-300 border border-red-500/30"
                      onClick={() => {
                        if (confirm(`Удалить «${s.title}»?`)) serviceActions.remove(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ServiceDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? blank}
        editingId={editing?.id}
      />
    </div>
  );
}

function ServiceDialog({
  open,
  onOpenChange,
  initial,
  editingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Omit<Service, "id"> | Service;
  editingId?: string;
}) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial, open]);
  const cats = categories.filter((c) => c.id !== "all");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редактировать услугу" : "Новая услуга"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Название">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Категория">
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as Service["category"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Длительность (мин)">
              <Input
                type="number"
                value={form.durationMin}
                onChange={(e) =>
                  setForm({ ...form, durationMin: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Цена (сум)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="Описание">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <ImageUpload
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            folder="services"
            label="Обложка услуги"
          />
          <label className="flex items-center gap-2 text-[14px]">
            <Checkbox
              checked={!!form.popular}
              onCheckedChange={(v) => setForm({ ...form, popular: !!v })}
            />
            Популярная (топ)
          </label>

          <details className="rounded-md border border-bg-ivory/15 bg-bg-ivory/5 p-2">
            <summary className="cursor-pointer text-[13px] font-medium text-bg-ivory/80">
              🇺🇿 Перевод на узбекский (необязательно)
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Название (UZ)">
                <Input
                  value={form.titleUz ?? ""}
                  onChange={(e) => setForm({ ...form, titleUz: e.target.value })}
                  placeholder="Klassik manikür"
                />
              </Field>
              <Field label="Описание (UZ)">
                <Textarea
                  value={form.descriptionUz ?? ""}
                  onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                  placeholder="Apparat ishlovi, kutikula oziqlantirish..."
                />
              </Field>
              <p className="text-[11px] text-muted-foreground">
                Если оставить пусто — узбекским клиентам покажется русское название.
              </p>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (!form.title.trim()) return;
              if (editingId) serviceActions.update(editingId, form);
              else serviceActions.add(form);
              onOpenChange(false);
            }}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Masters ---------- */

function MastersTab() {
  const { masters, services, branches } = useStore();
  const [editing, setEditing] = useState<Master | null>(null);
  const [open, setOpen] = useState(false);

  const blank: Omit<Master, "id"> = {
    name: "",
    role: "Мастер",
    image: masters[0]?.image ?? "",
    rating: 5,
    yearsExp: 1,
    serviceIds: [],
    branchIds: [],
    commissionPct: 40,
    workHours: {},
    nameUz: "",
    roleUz: "",
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="pill-accent"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Добавить мастера
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {masters.map((m) => (
          <Card key={m.id} className="bg-bg-ivory/5 border-bg-ivory/10">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start gap-3">
                <img
                  src={m.image}
                  alt={m.name}
                  loading="lazy"
                  className="h-14 w-14 rounded-pill object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-bg-ivory">{m.name}</h3>
                  <p className="text-[12px] text-bg-ivory/60">{m.role}</p>
                  <p className="text-[12px] text-accent">
                    ★ {m.rating} · {m.yearsExp} лет
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-bg-ivory/80 hover:bg-bg-ivory/10 hover:text-bg-ivory border border-bg-ivory/15"
                    onClick={() => {
                      setEditing(m);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-400/90 hover:bg-red-500/10 hover:text-red-300 border border-red-500/30"
                    onClick={() => {
                      if (confirm(`Удалить ${m.name}?`)) masterActions.remove(m.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-bg-ivory/50">
                Услуг: {m.serviceIds.length} · Филиалов: {m.branchIds.length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <MasterDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? blank}
        editingId={editing?.id}
        allServices={services}
        allBranches={branches}
      />
    </div>
  );
}

function MasterDialog({
  open,
  onOpenChange,
  initial,
  editingId,
  allServices,
  allBranches,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Omit<Master, "id"> | Master;
  editingId?: string;
  allServices: Service[];
  allBranches: Branch[];
}) {
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial, open]);

  const toggle = (key: "serviceIds" | "branchIds", id: string) => {
    const has = form[key].includes(id);
    setForm({
      ...form,
      [key]: has ? form[key].filter((x) => x !== id) : [...form[key], id],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редактировать мастера" : "Новый мастер"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Имя">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Должность">
            <Input
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Рейтинг">
              <Input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: parseFloat(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Стаж (лет)">
              <Input
                type="number"
                value={form.yearsExp}
                onChange={(e) =>
                  setForm({ ...form, yearsExp: parseInt(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <ImageUpload
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            folder="masters"
            label="Фото мастера"
          />

          <div>
            <Label className="mb-2 block">Услуги</Label>
            <div className="grid grid-cols-2 gap-2">
              {allServices.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[13px]">
                  <Checkbox
                    checked={form.serviceIds.includes(s.id)}
                    onCheckedChange={() => toggle("serviceIds", s.id)}
                  />
                  {s.title}
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Филиалы</Label>
            <div className="grid grid-cols-2 gap-2">
              {allBranches.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-[13px]">
                  <Checkbox
                    checked={form.branchIds.includes(b.id)}
                    onCheckedChange={() => toggle("branchIds", b.id)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>

          <Field label="Комиссия мастера (% от завершённой записи)">
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.commissionPct ?? 40}
              onChange={(e) =>
                setForm({ ...form, commissionPct: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>

          <WorkHoursEditor
            value={form.workHours ?? {}}
            onChange={(wh) => setForm({ ...form, workHours: wh })}
          />

          <details className="rounded-md border border-bg-ivory/15 bg-bg-ivory/5 p-2">
            <summary className="cursor-pointer text-[13px] font-medium text-bg-ivory/80">
              🇺🇿 Перевод на узбекский (необязательно)
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Имя (UZ)">
                <Input
                  value={form.nameUz ?? ""}
                  onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
                  placeholder="Malika R."
                />
              </Field>
              <Field label="Должность (UZ)">
                <Input
                  value={form.roleUz ?? ""}
                  onChange={(e) => setForm({ ...form, roleUz: e.target.value })}
                  placeholder="Top manikür ustasi"
                />
              </Field>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (!form.name.trim()) return;
              if (editingId) masterActions.update(editingId, form);
              else masterActions.add(form);
              onOpenChange(false);
            }}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Promos ---------- */

function PromosTab() {
  const { promos } = useStore();
  const [editing, setEditing] = useState<Promo | null>(null);
  const [open, setOpen] = useState(false);

  const blank: Omit<Promo, "id"> = {
    title: "",
    description: "",
    badge: "−10%",
    validUntil: "до 31 декабря",
    image: promos[0]?.image ?? "",
    discountPct: 10,
    serviceIds: [],
    titleUz: "",
    descriptionUz: "",
    badgeUz: "",
    validUntilUz: "",
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="pill-accent"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Добавить акцию
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {promos.map((p) => (
          <Card key={p.id} className="bg-bg-ivory/5 border-bg-ivory/10 overflow-hidden">
            <img src={p.image} alt={p.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                  {p.badge}
                </span>
                <span className="text-[11px] text-bg-ivory/50">{p.validUntil}</span>
              </div>
              <h3 className="font-bold text-bg-ivory">{p.title}</h3>
              <p className="text-[12px] text-bg-ivory/60">{p.description}</p>
              <div className="flex justify-end gap-1 pt-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-bg-ivory/80 hover:bg-bg-ivory/10 hover:text-bg-ivory border border-bg-ivory/15"
                  onClick={() => {
                    setEditing(p);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-400/90 hover:bg-red-500/10 hover:text-red-300 border border-red-500/30"
                  onClick={() => {
                    if (confirm(`Удалить «${p.title}»?`)) promoActions.remove(p.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PromoDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing ?? blank}
        editingId={editing?.id}
      />
    </div>
  );
}

function PromoDialog({
  open,
  onOpenChange,
  initial,
  editingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Omit<Promo, "id"> | Promo;
  editingId?: string;
}) {
  const [form, setForm] = useState(initial);
  const { services } = useStore();
  useEffect(() => setForm(initial), [initial, open]);

  const toggleService = (id: string) => {
    const cur = form.serviceIds ?? [];
    setForm({
      ...form,
      serviceIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Редактировать акцию" : "Новая акция"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Заголовок">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Описание">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Бейдж">
              <Input
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
              />
            </Field>
            <Field label="Срок действия">
              <Input
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </Field>
          </div>
          <ImageUpload
            value={form.image}
            onChange={(url) => setForm({ ...form, image: url })}
            folder="promos"
            label="Картинка акции"
          />

          <Field label="Реальная скидка (%) — применяется автоматически при записи">
            <Input
              type="number"
              min={0}
              max={100}
              value={form.discountPct ?? 0}
              onChange={(e) =>
                setForm({ ...form, discountPct: parseInt(e.target.value) || 0 })
              }
            />
          </Field>

          <div>
            <Label className="mb-2 block">Применяется к услугам (пусто = ко всем)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-md border border-bg-ivory/10 p-2">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[13px]">
                  <Checkbox
                    checked={(form.serviceIds ?? []).includes(s.id)}
                    onCheckedChange={() => toggleService(s.id)}
                  />
                  {s.title}
                </label>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Скидка применится только если клиент выбрал одну из этих услуг (или ко всем если ничего не выбрано).
            </p>
          </div>

          <details className="rounded-md border border-bg-ivory/15 bg-bg-ivory/5 p-2">
            <summary className="cursor-pointer text-[13px] font-medium text-bg-ivory/80">
              🇺🇿 Перевод на узбекский (необязательно)
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Заголовок (UZ)">
                <Input
                  value={form.titleUz ?? ""}
                  onChange={(e) => setForm({ ...form, titleUz: e.target.value })}
                  placeholder="Klassik manikürga −20%"
                />
              </Field>
              <Field label="Описание (UZ)">
                <Textarea
                  value={form.descriptionUz ?? ""}
                  onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Бейдж (UZ)">
                  <Input
                    value={form.badgeUz ?? ""}
                    onChange={(e) => setForm({ ...form, badgeUz: e.target.value })}
                    placeholder="Yangilik"
                  />
                </Field>
                <Field label="Срок (UZ)">
                  <Input
                    value={form.validUntilUz ?? ""}
                    onChange={(e) => setForm({ ...form, validUntilUz: e.target.value })}
                    placeholder="30-noyabrgacha"
                  />
                </Field>
              </div>
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              if (!form.title.trim()) return;
              if (editingId) promoActions.update(editingId, form);
              else promoActions.add(form);
              onOpenChange(false);
            }}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ---------- Customers (CRM) ---------- */

function CustomersTab() {
  const { data: customers, isLoading } = useAdminCustomers();
  const { data: bookings } = useAllBookingsAdmin();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const exportCustMut = useExportCustomers();
  const exportCust = async () => {
    const r = await exportCustMut.mutateAsync();
    if (r.ok && r.csv) {
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(r.csv, `bravo-customers-${stamp}.csv`);
    }
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((c) => {
      return (
        (c.firstName ?? "").toLowerCase().includes(needle) ||
        (c.lastName ?? "").toLowerCase().includes(needle) ||
        (c.username ?? "").toLowerCase().includes(needle) ||
        (c.phone ?? "").includes(needle) ||
        String(c.tgUserId).includes(needle)
      );
    });
  }, [customers, q]);

  return (
    <div className="space-y-4 text-bg-ivory">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по имени / @username / телефону / ID"
          className="max-w-md flex-1 bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory placeholder:text-bg-ivory/40"
        />
        <Button
          size="sm"
          variant="pill-outline"
          onClick={exportCust}
          disabled={exportCustMut.isPending}
          className="text-bg-ivory"
        >
          {exportCustMut.isPending ? "..." : "⇣ Экспорт CSV"}
        </Button>
        <span className="text-[13px] text-bg-ivory/60">
          {filtered.length}/{customers.length}
        </span>
      </div>

      {isLoading && filtered.length === 0 && (
        <p className="text-[13px] text-bg-ivory/50">Загружаем…</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => {
          const visits = bookings.filter(
            (b) => b.tgUserId === c.tgUserId && b.status === "completed",
          ).length;
          const name =
            [c.firstName, c.lastName].filter(Boolean).join(" ") ||
            c.username ||
            `ID ${c.tgUserId}`;
          return (
            <button
              key={c.tgUserId}
              type="button"
              onClick={() => setSelected(c.tgUserId)}
              className="text-left rounded-[14px] border border-bg-ivory/10 bg-bg-ivory/5 p-3 hover:bg-bg-ivory/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-bg-ivory truncate">{name}</p>
                  {c.username && (
                    <p className="text-[11px] text-bg-ivory/60">@{c.username}</p>
                  )}
                  {c.phone && (
                    <p className="text-[11px] text-bg-ivory/60">{c.phone}</p>
                  )}
                </div>
                {c.adminNote && (
                  <span
                    title={c.adminNote}
                    className="rounded-pill bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 shrink-0"
                  >
                    📝
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-bg-ivory/60">
                <span>Визитов: <b className="text-bg-ivory">{visits}</b></span>
                <span>·</span>
                <span>Бонусы: <b className="text-accent">{c.bonusPoints}</b></span>
              </div>
              <div className="mt-0.5 text-[11px] text-bg-ivory/50">
                Потрачено: {c.totalSpent.toLocaleString("ru-RU")} сум
              </div>
            </button>
          );
        })}
      </div>

      <CustomerDetailDialog
        tgUserId={selected}
        onClose={() => setSelected(null)}
        bookings={bookings}
      />
    </div>
  );
}

function CustomerDetailDialog({
  tgUserId,
  onClose,
  bookings,
}: {
  tgUserId: number | null;
  onClose: () => void;
  bookings: ClientBooking[];
}) {
  const { data: c } = useAdminCustomerDetail(tgUserId);
  const setNoteMut = useSetCustomerNote();
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(c?.adminNote ?? "");
  }, [c?.adminNote]);

  const open = tgUserId !== null;
  const userBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.tgUserId === tgUserId)
        .sort((a, b) => b.startAt.localeCompare(a.startAt)),
    [bookings, tgUserId],
  );

  const name =
    [c?.firstName, c?.lastName].filter(Boolean).join(" ") ||
    c?.username ||
    (tgUserId ? `ID ${tgUserId}` : "");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-bg-deep text-bg-ivory border-bg-ivory/15 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bg-ivory">{name}</DialogTitle>
        </DialogHeader>

        {c && (
          <div className="space-y-4 text-[13px]">
            {/* stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[12px] bg-bg-ivory/5 p-3">
                <p className="text-[10px] uppercase text-bg-ivory/50">Бонусы</p>
                <p className="mt-1 text-[18px] font-bold text-accent">
                  {c.bonusPoints}
                </p>
              </div>
              <div className="rounded-[12px] bg-bg-ivory/5 p-3">
                <p className="text-[10px] uppercase text-bg-ivory/50">Визитов</p>
                <p className="mt-1 text-[18px] font-bold">{c.visitsCount}</p>
              </div>
              <div className="rounded-[12px] bg-bg-ivory/5 p-3">
                <p className="text-[10px] uppercase text-bg-ivory/50">Потрачено</p>
                <p className="mt-1 text-[14px] font-bold">
                  {c.totalSpent.toLocaleString("ru-RU")}
                </p>
              </div>
            </div>

            {/* contact */}
            <div className="rounded-[12px] bg-bg-ivory/5 p-3 space-y-1">
              {c.username && <p>Telegram: @{c.username}</p>}
              <p>ID: {c.tgUserId}</p>
              {c.phone && (
                <p>
                  Телефон:{" "}
                  <a
                    href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}
                    className="text-accent underline"
                  >
                    {c.phone}
                  </a>
                </p>
              )}
              {c.birthday && <p>День рождения: {c.birthday}</p>}
            </div>

            {/* admin note */}
            <div>
              <Label className="text-bg-ivory">Заметка (видна только админу)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Аллергии, предпочтения, особые случаи…"
                className="mt-1 bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
                maxLength={2000}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="pill-accent"
                  disabled={setNoteMut.isPending}
                  onClick={() =>
                    setNoteMut.mutate({
                      tgUserId: c.tgUserId,
                      note: note || null,
                    })
                  }
                >
                  {setNoteMut.isPending ? "..." : "Сохранить заметку"}
                </Button>
              </div>
            </div>

            {/* history */}
            <div>
              <p className="text-[11px] uppercase tracking-wider text-bg-ivory/50 mb-2">
                История ({userBookings.length})
              </p>
              <div className="max-h-64 overflow-auto space-y-1.5">
                {userBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-[10px] bg-bg-ivory/5 p-2 text-[12px]"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{b.serviceTitle}</p>
                      <p className="text-[10px] text-bg-ivory/50">
                        {b.startAt.slice(0, 10)} · {b.startAt.slice(11, 16)} ·{" "}
                        {b.masterName}
                      </p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                ))}
                {userBookings.length === 0 && (
                  <p className="text-[12px] text-bg-ivory/50">Записей пока нет.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


function BroadcastDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const broadcastMut = useBroadcast();
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const submit = async () => {
    if (!text.trim()) return;
    if (!confirm("Отправить сообщение всем клиентам? Отменить будет нельзя.")) return;
    const r = await broadcastMut.mutateAsync(text.trim());
    if (r.ok) setResult({ sent: r.sent, failed: r.failed });
    else alert(r.error ?? "Не удалось отправить");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bg-deep text-bg-ivory border-bg-ivory/15 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-bg-ivory">Массовая рассылка</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-2 text-[14px]">
            <p>Отправлено: <b className="text-emerald-400">{result.sent}</b></p>
            <p>Не доставлено: <b className="text-red-400">{result.failed}</b></p>
            <p className="text-[12px] text-bg-ivory/60">
              Не доставлено = клиент заблокировал бота или ещё не нажимал /start.
            </p>
            <DialogFooter>
              <Button variant="pill-accent" onClick={() => { setResult(null); setText(""); onClose(); }}>
                Готово
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Напишите сообщение для клиентов. HTML поддерживается: <b>жирный</b>, <i>курсив</i>, <a href=...>ссылка</a>"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
              maxLength={4000}
            />
            <p className="text-[11px] text-bg-ivory/50">
              Отправится всем кто хоть раз пользовался Mini App. Не злоупотребляйте — клиенты могут заблокировать бота.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Закрыть</Button>
              <Button variant="pill-accent" onClick={submit} disabled={broadcastMut.isPending || !text.trim()}>
                {broadcastMut.isPending ? "Отправляем..." : "Отправить всем"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


function RevenueCharts({ bookings }: { bookings: ClientBooking[] }) {
  const [period, setPeriod] = useState<"7d" | "30d" | "12m">("7d");

  // Aggregate revenue by day (for 7d/30d) or by month (12m).
  const data = useMemo(() => {
    const now = new Date();
    const buckets: { key: string; label: string; revenue: number; count: number }[] = [];

    if (period === "12m") {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("ru-RU", { month: "short" });
        buckets.push({ key, label, revenue: 0, count: 0 });
      }
      const map = new Map(buckets.map((b) => [b.key, b]));
      bookings.forEach((b) => {
        if (b.status === "cancelled") return;
        const key = b.startAt.slice(0, 7);
        const bucket = map.get(key);
        if (bucket) {
          bucket.revenue += b.price;
          bucket.count += 1;
        }
      });
    } else {
      const days = period === "7d" ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        buckets.push({ key, label, revenue: 0, count: 0 });
      }
      const map = new Map(buckets.map((b) => [b.key, b]));
      bookings.forEach((b) => {
        if (b.status === "cancelled") return;
        const key = b.startAt.slice(0, 10);
        const bucket = map.get(key);
        if (bucket) {
          bucket.revenue += b.price;
          bucket.count += 1;
        }
      });
    }
    return buckets;
  }, [bookings, period]);

  return (
    <div className="rounded-[20px] border border-bg-ivory/10 bg-bg-ivory/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider text-bg-ivory/60">
          Графики выручки
        </p>
        <div className="flex gap-1">
          {(["7d", "30d", "12m"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold ${period === p ? "bg-accent text-accent-foreground" : "bg-bg-ivory/10 text-bg-ivory/70"}`}
            >
              {p === "7d" ? "7 дн" : p === "30d" ? "30 дн" : "12 мес"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} />
            <YAxis
              tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: "#0B0B0B",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(v: number) => v.toLocaleString("ru-RU") + " сум"}
            />
            <Line type="monotone" dataKey="revenue" stroke="#FFD93D" strokeWidth={2} dot={{ r: 3, fill: "#FFD93D" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.5)" }} width={30} />
            <Tooltip
              contentStyle={{
                background: "#0B0B0B",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) => v + " записей"}
            />
            <Bar dataKey="count" fill="rgba(255,217,61,0.5)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-bg-ivory/50">
        Верх: выручка (сум). Низ: количество записей. Отменённые не учитываются.
      </p>
    </div>
  );
}


function WorkHoursEditor({
  value,
  onChange,
}: {
  value: import("@/lib/server/catalog-db").WorkHours;
  onChange: (v: import("@/lib/server/catalog-db").WorkHours) => void;
}) {
  const days: { key: keyof typeof value; label: string }[] = [
    { key: "mon", label: "Пн" },
    { key: "tue", label: "Вт" },
    { key: "wed", label: "Ср" },
    { key: "thu", label: "Чт" },
    { key: "fri", label: "Пт" },
    { key: "sat", label: "Сб" },
    { key: "sun", label: "Вс" },
  ];
  return (
    <div>
      <Label className="mb-2 block">Рабочее время (формат "10:00-22:00" или "off")</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {days.map((d) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-10 text-[12px] text-muted-foreground">{d.label}</span>
            <Input
              value={value[d.key] ?? ""}
              placeholder="10:00-22:00 / off"
              onChange={(e) => onChange({ ...value, [d.key]: e.target.value })}
              className="h-9 text-[13px]"
            />
            <button
              type="button"
              onClick={() => onChange({ ...value, [d.key]: "off" })}
              className="rounded-pill bg-bg-ivory/10 px-2 py-1 text-[11px] text-bg-ivory hover:bg-bg-ivory/15"
            >
              off
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ---------- Reviews moderation ---------- */

function ReviewsTab() {
  const { data: reviews, isLoading } = useAllReviewsAdmin();
  const moderate = useModerateReview();
  const reply = useReplyToReview();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (isLoading) {
    return <p className="text-[13px] text-bg-ivory/50">Загружаем…</p>;
  }
  if (!reviews || reviews.length === 0) {
    return <p className="text-[13px] text-bg-ivory/50">Отзывов пока нет.</p>;
  }

  return (
    <div className="space-y-3 text-bg-ivory">
      {reviews.map((r) => (
        <div
          key={r.id}
          className={`rounded-[16px] border p-3 ${
            r.status === "hidden"
              ? "border-red-500/20 bg-red-500/5 opacity-70"
              : "border-bg-ivory/10 bg-bg-ivory/5"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-bg-ivory">
                {r.customerName ?? `ID ${r.tgUserId}`}
              </p>
              <p className="text-[11px] text-bg-ivory/50">
                {new Date(r.createdAt * 1000).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                <span className="text-accent">{"★".repeat(r.rating)}</span>
                <span className="text-bg-ivory/20">{"★".repeat(5 - r.rating)}</span>
              </p>
            </div>
            <div className="flex gap-1">
              {r.status === "published" ? (
                <button
                  type="button"
                  onClick={() => moderate.mutate({ id: r.id, status: "hidden" })}
                  className="rounded-pill bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25"
                >
                  Скрыть
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => moderate.mutate({ id: r.id, status: "published" })}
                  className="rounded-pill bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/25"
                >
                  Опубликовать
                </button>
              )}
            </div>
          </div>
          {r.text && (
            <p className="mt-2 text-[13px] text-bg-ivory/85 leading-relaxed">{r.text}</p>
          )}
          {(r as { adminReply?: string }).adminReply && (
            <div className="mt-2 rounded-[12px] bg-accent/10 px-3 py-2 text-[12px] text-bg-ivory/85">
              <p className="text-[10px] uppercase tracking-wider text-accent">
                Ответ барбершопа
              </p>
              <p>{(r as { adminReply?: string }).adminReply}</p>
            </div>
          )}
          {editing === r.id ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder="Спасибо за отзыв! ..."
                className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
                maxLength={1000}
              />
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
                  Отмена
                </Button>
                <Button
                  size="sm"
                  variant="pill-accent"
                  disabled={reply.isPending}
                  onClick={async () => {
                    await reply.mutateAsync({ id: r.id, reply: draft });
                    setEditing(null);
                    setDraft("");
                  }}
                >
                  Сохранить ответ
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditing(r.id);
                setDraft((r as { adminReply?: string }).adminReply ?? "");
              }}
              className="mt-2 text-[11px] text-accent hover:underline"
            >
              {(r as { adminReply?: string }).adminReply ? "Изменить ответ" : "Ответить"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Master earnings ---------- */

function EarningsTab() {
  const [period, setPeriod] = useState<"7d" | "30d" | "ytd" | "all">("30d");
  const { data: earnings } = useMasterEarnings(period);
  const totalRevenue = (earnings ?? []).reduce((s, e) => s + e.revenue, 0);
  const totalCommission = (earnings ?? []).reduce((s, e) => s + e.commissionAmount, 0);

  return (
    <div className="space-y-4 text-bg-ivory">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-[18px] font-bold">Доходы и комиссии</h2>
        <div className="flex gap-1">
          {(["7d", "30d", "ytd", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-pill px-3 py-1 text-[12px] font-semibold ${
                period === p
                  ? "bg-accent text-accent-foreground"
                  : "bg-bg-ivory/10 text-bg-ivory/70"
              }`}
            >
              {p === "7d" ? "7 дн" : p === "30d" ? "30 дн" : p === "ytd" ? "С нач. года" : "Всё"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-accent/10 border border-accent/20 p-4">
          <p className="text-[11px] uppercase text-bg-ivory/60">Выручка</p>
          <p className="mt-1 text-[24px] font-bold text-accent">
            {formatSum(totalRevenue)}
          </p>
        </div>
        <div className="rounded-[16px] bg-bg-ivory/5 border border-bg-ivory/10 p-4">
          <p className="text-[11px] uppercase text-bg-ivory/60">Комиссии мастеров</p>
          <p className="mt-1 text-[24px] font-bold">{formatSum(totalCommission)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {(earnings ?? []).map((e) => (
          <div
            key={e.masterId || e.name}
            className="rounded-[14px] bg-bg-ivory/5 border border-bg-ivory/10 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-bg-ivory">{e.name}</p>
                <p className="text-[11px] text-bg-ivory/60">
                  Визитов: {e.visits} · Ставка: {e.commissionPct}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-bold text-accent">
                  {formatSum(e.commissionAmount)}
                </p>
                <p className="text-[10px] text-bg-ivory/50">
                  из {formatSum(e.revenue)}
                </p>
              </div>
            </div>
            <div className="mt-2 h-1 rounded-full bg-bg-ivory/10 overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${e.commissionPct}%` }}
              />
            </div>
          </div>
        ))}
        {(!earnings || earnings.length === 0) && (
          <p className="text-[13px] text-bg-ivory/50 text-center py-8">
            В этот период нет завершённых записей.
          </p>
        )}
      </div>
      <p className="text-[11px] text-bg-ivory/50">
        Учитываются только записи со статусом «Завершено». Ставка комиссии настраивается в карточке мастера.
      </p>
    </div>
  );
}


/* ---------- Day calendar by master ---------- */

function DayCalendarTab() {
  const { masters } = useStore();
  const { data: bookings } = useAllBookingsAdmin();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.startAt.startsWith(date) && b.status !== "cancelled"),
    [bookings, date],
  );

  const slots: string[] = [];
  for (let h = 10; h <= 21; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  slots.push("22:00");

  const shift = (delta: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-3 text-bg-ivory">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Календарь дня</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-pill bg-bg-ivory/10 px-3 py-1.5 text-[12px] hover:bg-bg-ivory/15"
            aria-label="Предыдущий день"
          >←</button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-bg-ivory/5 border border-bg-ivory/15 rounded-md px-2 py-1 text-[13px] text-bg-ivory"
          />
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-pill bg-bg-ivory/10 px-3 py-1.5 text-[12px] hover:bg-bg-ivory/15"
            aria-label="Следующий день"
          >→</button>
        </div>
      </div>

      <p className="text-[13px] text-bg-ivory/60">
        Записей на день: <b className="text-accent">{dayBookings.length}</b>
      </p>

      <div className="overflow-x-auto rounded-[16px] border border-bg-ivory/10 bg-bg-ivory/5">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `45px repeat(${masters.length}, minmax(110px, 1fr))`,
            minWidth: `${45 + masters.length * 110}px`,
          }}
        >
          <div className="border-b border-bg-ivory/10 p-2 text-[11px] text-bg-ivory/50">Время</div>
          {masters.map((m) => (
            <div
              key={m.id}
              className="border-b border-l border-bg-ivory/10 p-2 text-center text-[12px] font-semibold truncate"
              title={m.name}
            >
              {m.name}
            </div>
          ))}

          {slots.map((time) => (
            <DayCalendarRow
              key={time}
              time={time}
              masters={masters}
              dayBookings={dayBookings}
            />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-bg-ivory/50">
        Слот = 30 минут. Цветной квадрат = запись. Отменённые скрыты.
      </p>
    </div>
  );
}

function DayCalendarRow({
  time,
  masters,
  dayBookings,
}: {
  time: string;
  masters: Master[];
  dayBookings: ClientBooking[];
}) {
  return (
    <>
      <div className="border-b border-bg-ivory/5 p-1.5 text-right text-[11px] font-mono text-bg-ivory/50">
        {time}
      </div>
      {masters.map((m) => {
        const hit = dayBookings.find(
          (b) =>
            (b.masterId === m.id || b.masterName === m.name) &&
            b.startAt.slice(11, 16) === time,
        );
        const ongoing = !hit && dayBookings.find((b) => {
          if (b.masterId !== m.id && b.masterName !== m.name) return false;
          const start = b.startAt.slice(11, 16);
          const [sh, sm] = start.split(":").map(Number);
          const [th, tm] = time.split(":").map(Number);
          const sMin = sh * 60 + sm;
          const tMin = th * 60 + tm;
          return tMin > sMin && tMin < sMin + b.durationMin;
        });
        if (hit) {
          return (
            <div key={m.id} className="border-b border-l border-bg-ivory/5 p-1 text-[10px]">
              <div className="rounded-md bg-accent/20 px-1.5 py-1 leading-tight text-bg-ivory">
                <p className="font-semibold truncate" title={hit.serviceTitle}>{hit.serviceTitle}</p>
                <p className="text-bg-ivory/60 truncate">{hit.customerName ?? "—"}</p>
              </div>
            </div>
          );
        }
        if (ongoing) {
          return <div key={m.id} className="border-b border-l border-bg-ivory/5 bg-accent/10" />;
        }
        return <div key={m.id} className="border-b border-l border-bg-ivory/5" />;
      })}
    </>
  );
}

/* ---------- Certificates ---------- */

function CertsTab() {
  const { data: certs, isLoading } = useAdminCerts();
  const create = useCreateCert();
  const revoke = useRevokeCert();
  const [amount, setAmount] = useState(500000);
  const [ownerId, setOwnerId] = useState("");
  const [note, setNote] = useState("");
  const [expires, setExpires] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const submit = async () => {
    const r = await create.mutateAsync({
      amount,
      ownerTgId: ownerId ? Number(ownerId) : undefined,
      note: note.trim() || undefined,
      expiresAt: expires || undefined,
    });
    if (r.ok && r.cert) {
      setLastCode(r.cert.code);
      setAmount(500000);
      setOwnerId("");
      setNote("");
      setExpires("");
    }
  };

  return (
    <div className="space-y-4 text-bg-ivory">
      <div className="rounded-[16px] border border-bg-ivory/10 bg-bg-ivory/5 p-4">
        <h2 className="text-[16px] font-bold mb-3">Выпустить ваучер</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="Сумма (сум) *">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="TG ID владельца (если знаете)">
            <Input
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789 или пусто"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Истекает">
            <Input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Заметка">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Подарок маме / куплено за 500 000"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="pill-accent"
            onClick={submit}
            disabled={create.isPending || amount <= 0}
          >
            {create.isPending ? "..." : "Выпустить"}
          </Button>
          {lastCode && (
            <span className="rounded-pill bg-emerald-500/15 px-3 py-1.5 text-[12px] font-mono font-semibold text-emerald-400">
              ✓ Код: {lastCode}
            </span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-bg-ivory/50">
          Если TG ID не указан — ваучер можно дарить (любой человек активирует код в Mini App).
        </p>
      </div>

      <h3 className="text-[15px] font-bold">История ({certs?.length ?? 0})</h3>
      {isLoading && <p className="text-[13px] text-bg-ivory/50">Загружаем…</p>}
      <div className="space-y-2">
        {(certs ?? []).map((c) => (
          <div
            key={c.id}
            className={`rounded-[12px] border p-3 ${
              c.status === "active"
                ? "border-bg-ivory/10 bg-bg-ivory/5"
                : c.status === "spent"
                  ? "border-bg-ivory/10 bg-bg-ivory/5 opacity-60"
                  : "border-red-500/30 bg-red-500/5 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono font-bold text-accent">{c.code}</p>
                <p className="text-[12px] text-bg-ivory/70">
                  {c.amountBalance.toLocaleString("ru-RU")} /{" "}
                  {c.amountInitial.toLocaleString("ru-RU")} сум
                </p>
                <p className="text-[11px] text-bg-ivory/50">
                  {c.ownerTgId ? `Владелец: ${c.ownerTgId}` : "Без владельца"}
                  {c.expiresAt ? ` · до ${c.expiresAt}` : ""}
                </p>
                {c.note && <p className="text-[11px] text-bg-ivory/50">📝 {c.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-bg-ivory/10 px-2 py-0.5 text-[10px] font-semibold uppercase">
                  {c.status === "active" ? "активен" : c.status === "spent" ? "использован" : "отменён"}
                </span>
                {c.status === "active" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Аннулировать ваучер ${c.code}?`)) revoke.mutate(c.id);
                    }}
                    className="rounded-pill bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Packages (abonements) ---------- */

function PackagesTab() {
  const { services } = useStore();
  const { data: packages, isLoading } = useAdminPackages();
  const create = useCreatePackage();
  const revoke = useRevokePackage();
  const [ownerId, setOwnerId] = useState("");
  const [title, setTitle] = useState("");
  const [serviceId, setServiceId] = useState<string>("any");
  const [total, setTotal] = useState(10);
  const [expires, setExpires] = useState("");
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const submit = async () => {
    if (!ownerId || !title.trim() || total <= 0) return;
    const r = await create.mutateAsync({
      ownerTgId: Number(ownerId),
      title: title.trim(),
      serviceId: serviceId === "any" ? undefined : serviceId,
      totalVisits: total,
      expiresAt: expires || undefined,
    });
    if (r.ok) {
      setOkMsg(`Абонемент "${title}" выдан клиенту ${ownerId}`);
      setTitle("");
      setOwnerId("");
      setTotal(10);
      setExpires("");
      setTimeout(() => setOkMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-4 text-bg-ivory">
      <div className="rounded-[16px] border border-bg-ivory/10 bg-bg-ivory/5 p-4">
        <h2 className="text-[16px] font-bold mb-3">Выдать абонемент</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="TG ID клиента *">
            <Input
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value.replace(/\D/g, ""))}
              placeholder="123456789"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Название *">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="10 стрижек"
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Услуга (или Любая)">
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Любая услуга</SelectItem>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Кол-во визитов *">
            <Input
              type="number"
              value={total}
              onChange={(e) => setTotal(parseInt(e.target.value) || 0)}
              min={1}
              max={100}
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
          <Field label="Истекает">
            <Input
              type="date"
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
              className="bg-bg-ivory/5 border-bg-ivory/15 text-bg-ivory"
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="pill-accent"
            onClick={submit}
            disabled={create.isPending || !ownerId || !title.trim() || total <= 0}
          >
            {create.isPending ? "..." : "Выдать"}
          </Button>
          {okMsg && (
            <span className="text-[12px] text-emerald-400">{okMsg}</span>
          )}
        </div>
        <p className="mt-2 text-[11px] text-bg-ivory/50">
          TG ID можно скопировать с вкладки «Клиенты» или попросить клиента написать его (видно у @userinfobot).
        </p>
      </div>

      <h3 className="text-[15px] font-bold">Активные абонементы</h3>
      {isLoading && <p className="text-[13px] text-bg-ivory/50">Загружаем…</p>}
      <div className="space-y-2">
        {(packages ?? []).map((p) => {
          const remaining = p.totalVisits - p.usedVisits;
          return (
            <div
              key={p.id}
              className={`rounded-[12px] border p-3 ${
                p.status === "active"
                  ? "border-bg-ivory/10 bg-bg-ivory/5"
                  : "border-bg-ivory/10 bg-bg-ivory/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-[11px] text-bg-ivory/60">
                    Клиент: {p.ownerTgId} · Использовано {p.usedVisits}/{p.totalVisits}
                    {p.expiresAt ? ` · до ${p.expiresAt}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    осталось {remaining}
                  </span>
                  {p.status === "active" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Аннулировать абонемент?`)) revoke.mutate(p.id);
                      }}
                      className="rounded-pill bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-400 hover:bg-red-500/25"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2 h-1 rounded-full bg-bg-ivory/10 overflow-hidden">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.round((p.usedVisits / p.totalVisits) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
        {(!packages || packages.length === 0) && !isLoading && (
          <p className="text-[13px] text-bg-ivory/50 text-center py-8">
            Абонементов пока нет.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- Staff (admins) tab ---------- */

import { adminAuthPayload } from "@/lib/admin-creds";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function useAdminsList() {
  return useQuery({
    queryKey: ["admins"],
    queryFn: () => listAdminsFn({ data: adminAuthPayload() }),
  });
}

function StaffTab() {
  const { data: admins, isLoading } = useAdminsList();
  const { masters } = useStore();
  const qc = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);

  const delMut = useMutation({
    mutationFn: (id: string) =>
      deleteAdminFn({ data: { ...adminAuthPayload(), id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admins"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold">Сотрудники</h2>
        <Button variant="pill-accent" size="sm" onClick={() => setOpenCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Добавить
        </Button>
      </div>

      <p className="text-[12px] text-bg-ivory/55">
        Супер-админ видит всё и управляет сотрудниками. У мастера — доступ только
        к его записям; новые брони мастеру приходят в Telegram, если указан Telegram ID.
      </p>

      {isLoading ? (
        <p className="text-[13px] text-bg-ivory/50">Загрузка…</p>
      ) : !admins || admins.length === 0 ? (
        <p className="rounded-[16px] bg-bg-ivory/5 p-4 text-[13px] text-bg-ivory/60">
          Пока только супер-админ. Добавьте мастера, чтобы он получал уведомления.
        </p>
      ) : (
        <div className="space-y-2">
          {admins.map((a) => {
            const m = masters.find((x) => x.id === a.masterId);
            return (
              <div
                key={a.id}
                className="rounded-[16px] bg-bg-ivory/5 p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold">
                    {a.displayName ?? a.login}{" "}
                    <span
                      className={`ml-1 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase ${
                        a.role === "super"
                          ? "bg-accent text-accent-foreground"
                          : "bg-bg-ivory/10 text-bg-ivory/70"
                      }`}
                    >
                      {a.role}
                    </span>
                  </p>
                  <p className="text-[11px] text-bg-ivory/55">
                    Логин: <span className="font-mono">{a.login}</span>
                    {m ? ` · мастер: ${m.name}` : ""}
                    {a.tgUserId ? ` · TG: ${a.tgUserId}` : ""}
                  </p>
                </div>
                {a.login !== "admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Удалить «${a.login}»?`)) delMut.mutate(a.id);
                    }}
                    className="text-red-300 hover:text-red-200"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <CreateAdminDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        masters={masters}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["admins"] });
          setOpenCreate(false);
        }}
      />
    </div>
  );
}

function CreateAdminDialog({
  open,
  onClose,
  masters,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  masters: Master[];
  onCreated: () => void;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("master");
  const [masterId, setMasterId] = useState<string>("");
  const [tgUserId, setTgUserId] = useState<string>("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setLogin("");
      setPassword("");
      setRole("master");
      setMasterId("");
      setTgUserId("");
      setDisplayName("");
      setErr("");
    }
  }, [open]);

  const submit = async () => {
    setErr("");
    if (!login.trim() || password.length < 4) {
      setErr("Логин обязателен, пароль ≥ 4 символов");
      return;
    }
    setBusy(true);
    try {
      const r = await createAdminFn({
        data: {
          ...adminAuthPayload(),
          login: login.trim(),
          password,
          role,
          masterId: role === "master" && masterId ? masterId : null,
          tgUserId: tgUserId ? Number(tgUserId) : null,
          displayName: displayName.trim() || null,
        },
      });
      if (!r.ok) setErr(r.error ?? "Не удалось создать");
      else onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bg-deep text-bg-ivory border-bg-ivory/15">
        <DialogHeader>
          <DialogTitle>Новый сотрудник</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Имя</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Например: Тимур Каримов"
            />
          </div>
          <div>
            <Label>Логин *</Label>
            <Input
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="timur"
              autoComplete="off"
            />
          </div>
          <div>
            <Label>Пароль *</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>Роль</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master">Мастер (видит свои записи)</SelectItem>
                <SelectItem value="super">Супер-админ (полный доступ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === "master" && (
            <div>
              <Label>Привязать к мастеру</Label>
              <Select value={masterId} onValueChange={setMasterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите мастера" />
                </SelectTrigger>
                <SelectContent>
                  {masters.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Telegram User ID (для уведомлений)</Label>
            <Input
              inputMode="numeric"
              value={tgUserId}
              onChange={(e) => setTgUserId(e.target.value.replace(/\D/g, ""))}
              placeholder="например: 123456789"
            />
            <p className="mt-1 text-[11px] text-bg-ivory/50">
              Если указан — на этот аккаунт придёт сообщение в Telegram при новой записи.
            </p>
          </div>
          {err && <p className="text-[12px] text-red-400">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button variant="pill-accent" onClick={submit} disabled={busy}>
            {busy ? "Создание…" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


