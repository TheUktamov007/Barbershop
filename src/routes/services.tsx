import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/mini/BottomNav";
import { ServiceCard } from "@/components/mini/ServiceCard";
import { categories, formatDuration, formatSum, type CategoryId } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useLocalize, useLocalizeCategory } from "@/lib/localize";
import { Search, X } from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Услуги — Bravo" },
      { name: "description", content: "Полный каталог услуг сети барбершопов Bravo." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const t = useT();
  const L = useLocalize();
  const Lcat = useLocalizeCategory();
  const [cat, setCat] = useState<CategoryId>("all");
  const [q, setQ] = useState("");
  const { services } = useStore();

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchCat = cat === "all" || s.category === cat;
      const needle = q.toLowerCase();
      const matchQ =
        !needle ||
        s.title.toLowerCase().includes(needle) ||
        (s.titleUz ?? "").toLowerCase().includes(needle);
      return matchCat && matchQ;
    });
  }, [cat, q, services]);

  return (
    <main className="mx-auto min-h-screen max-w-md bg-bg-deep pb-28 text-bg-ivory">
      <header className="px-5 pt-12 pb-4">
        <span className="caption text-accent">{t("services.catalog")}</span>
        <h1 className="mt-2 text-[36px] font-bold leading-[1.05]">
          {t("services.title")}{" "}
          <span className="font-serif-italic text-accent">{t("services.title.suffix")}</span>
        </h1>

        <div className="mt-5 flex items-center gap-2 rounded-pill bg-bg-ivory/8 border border-bg-ivory/10 px-4 py-3">
          <Search className="h-4 w-4 text-bg-ivory/50" strokeWidth={1.7} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("services.search")}
            className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-bg-ivory/40"
          />
          {q && (
            <button onClick={() => setQ("")} className="text-bg-ivory/50" aria-label="Очистить">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
                cat === c.id
                  ? "bg-bg-ivory text-bg-deep"
                  : "bg-bg-ivory/10 text-bg-ivory/80"
              }`}
            >
              {c.id === "all" ? t("chip.all") : Lcat(c.id)}
            </button>
          ))}
        </div>
      </header>

      <section className="px-5">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-bg-ivory/50">
            {t("services.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((s) => (
              <Link
                key={s.id}
                to="/services/$id"
                params={{ id: s.id }}
                className="block"
              >
                <ServiceCard
                  image={s.image}
                  title={L(s.title, s.titleUz)}
                  duration={formatDuration(s.durationMin)}
                  price={formatSum(s.price).replace(" сум", "")}
                  category={s.category}
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}
