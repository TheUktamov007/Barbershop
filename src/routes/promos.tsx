import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/mini/BottomNav";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { useLocalize } from "@/lib/localize";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/promos")({
  head: () => ({
    meta: [
      { title: "Акции — Bravo" },
      { name: "description", content: "Действующие акции и спецпредложения Bravo Barbershop." },
    ],
  }),
  component: PromosPage,
});

/**
 * Map a promo to a list of service ids by keyword. Lets "Воспользоваться"
 * pre-fill the booking flow with the relevant service instead of dropping
 * the user into a blank catalog.
 */
function inferServiceIds(
  title: string,
  description: string,
  services: ReturnType<typeof useStore>["services"],
): string[] {
  const text = (title + " " + description).toLowerCase();
  const matches = services
    .filter((s) => {
      const t = s.title.toLowerCase();
      const cat = s.category.toLowerCase();
      // Pick services whose title or category appears in the promo text.
      return (
        text.includes(t) ||
        (cat === "haircut" && /стрижк|фейд|андеркат/.test(text)) ||
        (cat === "beard" && /бород|моделирован/.test(text)) ||
        (cat === "shave" && /бритьё|бритье|опасн/.test(text)) ||
        (cat === "kids" && /детск|малыш/.test(text)) ||
        (cat === "coloring" && /камуфляж|окрашиван|седин/.test(text)) ||
        (cat === "styling" && /укладк|стайлинг|финиш/.test(text)) ||
        (cat === "combo" && /комбо|стрижк.*бород/.test(text))
      );
    })
    .map((s) => s.id);
  return matches;
}

function PromosPage() {
  const { promos, services } = useStore();
  const L = useLocalize();
  return (
    <main className="mx-auto min-h-screen max-w-md md:max-w-5xl bg-bg-deep pb-28 text-bg-ivory">
      <header className="px-5 pt-12">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-pill bg-bg-ivory/10"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
          </Link>
          <div>
            <span className="caption text-accent">Сейчас</span>
            <h1 className="text-[28px] font-bold leading-tight">
              Актуальные <span className="font-serif-italic text-accent">акции</span>
            </h1>
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-5">
        {promos.map((p) => (
          <article
            key={p.id}
            className="relative overflow-hidden rounded-[28px] bg-bg-ivory/5"
          >
            <img
              src={p.image}
              alt={L(p.title, p.titleUz)}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-pill bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground">
                  {L(p.badge, p.badgeUz)}
                </span>
                <span className="caption text-bg-ivory/50">{L(p.validUntil, p.validUntilUz)}</span>
              </div>
              <h2 className="text-[18px] font-bold leading-tight">{L(p.title, p.titleUz)}</h2>
              <p className="text-[13px] text-bg-ivory/70">{L(p.description, p.descriptionUz)}</p>
              {(() => {
                // Prefer promo's explicit service list; fall back to keyword
                // heuristic for legacy promos with empty serviceIds.
                const ids =
                  p.serviceIds && p.serviceIds.length > 0
                    ? p.serviceIds
                    : inferServiceIds(p.title, p.description, services);
                const search = {
                  ...(ids.length > 0 ? { services: ids.join(",") } : {}),
                  promo: p.id,
                  step: 1 as const,
                };
                return (
                  <>
                    {p.discountPct > 0 && (
                      <div className="rounded-pill bg-accent/15 px-3 py-1.5 text-center text-[12px] font-semibold text-accent">
                        ✓ Скидка {p.discountPct}% применится автоматически
                      </div>
                    )}
                    <Button asChild variant="pill-accent" size="default" className="mt-2 w-full">
                      <Link to="/booking" search={search}>
                        Воспользоваться
                      </Link>
                    </Button>
                  </>
                );
              })()}
            </div>
          </article>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}
