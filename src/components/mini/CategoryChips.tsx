import { useT } from "@/lib/i18n";

export function CategoryChips() {
  const t = useT();
  const categories = [
    { id: "all", label: t("chip.all") },
    { id: "haircut", label: t("cat.haircut") },
    { id: "beard", label: t("cat.beard") },
    { id: "shave", label: t("cat.shave") },
    { id: "combo", label: t("cat.combo") },
    { id: "kids", label: t("cat.kids") },
  ];
  return (
    <section className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c, i) => (
        <button
          key={c.id}
          className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-medium transition-colors ${
            i === 0
              ? "bg-bg-ivory text-bg-deep"
              : "bg-bg-ivory/10 text-bg-ivory/80 hover:bg-bg-ivory/15"
          }`}
        >
          {c.label}
        </button>
      ))}
    </section>
  );
}
