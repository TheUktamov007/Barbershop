import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroRadial } from "@/components/mini/HeroRadial";
import { PromoSlider } from "@/components/mini/PromoSlider";
import { CategoryChips } from "@/components/mini/CategoryChips";
import { ServiceCard } from "@/components/mini/ServiceCard";
import { LoyaltyBanner } from "@/components/mini/LoyaltyBanner";
import { BottomNav } from "@/components/mini/BottomNav";
import { MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatDuration, formatSum } from "@/lib/mock";
import { useT } from "@/lib/i18n";
import { useLocalize } from "@/lib/localize";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bravo вЂ” РїСЂРµРјРёР°Р»СЊРЅС‹Р№ Р±Р°СЂР±РµСЂС€РѕРї РІ РўР°С€РєРµРЅС‚Рµ" },
      {
        name: "description",
        content:
          "РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ РІ СЃРµС‚СЊ РїСЂРµРјРёР°Р»СЊРЅС‹С… Р±Р°СЂР±РµСЂС€РѕРїРѕРІ Bravo: СЃС‚СЂРёР¶РєРё, Р±РѕСЂРѕРґР°, Р±СЂРёС‚СЊС‘, СЃС‚Р°Р№Р»РёРЅРі. Р‘РѕРЅСѓСЃРЅР°СЏ РїСЂРѕРіСЂР°РјРјР° РґРѕ 15%.",
      },
      { property: "og:title", content: "Bravo вЂ” РїСЂРµРјРёР°Р»СЊРЅС‹Р№ Р±Р°СЂР±РµСЂС€РѕРї" },
      {
        property: "og:description",
        content: "РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ, Р»СЋР±РёРјС‹Рµ Р±Р°СЂР±РµСЂС‹, РєРµС€Р±СЌРє РґРѕ 15%.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const t = useT();
  const L = useLocalize();
  const { services, branches, isLoading } = useStore();
  const topServices = services.filter((s) => s.popular).slice(0, 4);
  const nearestBranch = branches[0];
  const showServiceSkeletons = isLoading && topServices.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-md md:max-w-5xl bg-bg-deep pb-28">
      <HeroRadial />

      <div className="space-y-8 pt-8">
        <PromoSlider />

        <section className="space-y-3 px-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold text-bg-ivory">
              {t("home.popular")}{" "}
              <span className="font-serif-italic text-accent">{t("home.popular.suffix")}</span>
            </h2>
            <Link to="/services" className="caption text-accent">{t("home.all_link")}</Link>
          </div>
          <CategoryChips />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
            {showServiceSkeletons
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[24px] bg-bg-ivory/5 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-square bg-bg-ivory/10" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3 bg-bg-ivory/10 rounded w-3/4" />
                      <div className="h-3 bg-bg-ivory/10 rounded w-1/2" />
                    </div>
                  </div>
                ))
              : topServices.map((s) => (
                  <ServiceCard
                    key={s.id}
                    image={s.image}
                    title={L(s.title, s.titleUz)}
                    duration={formatDuration(s.durationMin)}
                    price={formatSum(s.price)}
                    category={s.category}
                  />
                ))}
            {!isLoading && topServices.length === 0 && (
              <div className="col-span-2 rounded-[20px] bg-bg-ivory/5 p-6 text-center text-[13px] text-bg-ivory/50">
                {t("home.empty_services")}
              </div>
            )}
          </div>
        </section>

        <LoyaltyBanner />

        {nearestBranch && (
          <section className="px-5">
            <Link
              to="/branches"
              className="flex items-center gap-3 rounded-[24px] glass-card p-4 text-bg-ivory"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-foreground">
                <MapPin className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="caption text-bg-ivory/60">{t("home.nearest_branch")}</p>
                <p className="text-[15px] font-semibold leading-tight">
                  {L(nearestBranch.name, nearestBranch.nameUz)}
                </p>
                <p className="text-[12px] text-bg-ivory/60">
                  {L(nearestBranch.address, nearestBranch.addressUz)} В· {nearestBranch.distanceKm} РєРј
                </p>
              </div>
              <span className="caption text-accent">{t("home.route")}</span>
            </Link>
          </section>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
