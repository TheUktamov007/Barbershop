import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/mini/BottomNav";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ArrowLeft, MapPin, Phone, Clock, Navigation } from "lucide-react";

export const Route = createFileRoute("/branches")({
  head: () => ({
    meta: [
      { title: "Р¤РёР»РёР°Р»С‹ вЂ” Bravo" },
      { name: "description", content: "Р’СЃРµ Р±Р°СЂР±РµСЂС€РѕРїС‹ СЃРµС‚Рё Bravo РІ РўР°С€РєРµРЅС‚Рµ." },
    ],
  }),
  component: BranchesPage,
});

function BranchesPage() {
  const { branches } = useStore();
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
            <span className="caption text-accent">РЎРµС‚СЊ Bravo</span>
            <h1 className="text-[28px] font-bold leading-tight">
              РќР°С€Рё <span className="font-serif-italic text-accent">С„РёР»РёР°Р»С‹</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Yandex map вЂ” single iframe with all branches as markers (using URL
          encoded "text") makes for a zero-key embed. For interactive routes
          tap the per-branch "РњР°СЂС€СЂСѓС‚" button в†’ opens Yandex/Google Maps app. */}
      {branches.length > 0 && (
        <section className="mt-5 px-5">
          <YandexMap
            query={branches.map((b) => b.address + ", РўР°С€РєРµРЅС‚").join("~")}
          />
        </section>
      )}

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 px-5">
        {branches.map((b) => (
          <article
            key={b.id}
            className="overflow-hidden rounded-[24px] bg-bg-ivory/5"
          >
            <img
              src={b.image}
              alt={b.name}
              loading="lazy"
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <h2 className="text-[18px] font-bold">{b.name}</h2>
                <span className="rounded-pill bg-accent/15 px-2.5 py-1 text-[10px] font-bold text-accent">
                  {b.distanceKm} РєРј
                </span>
              </div>
              <Info icon={<MapPin />} text={b.address} />
              <a href={`tel:${b.phone.replace(/[^+\d]/g, "")}`}>
                <Info icon={<Phone />} text={b.phone} />
              </a>
              <Info icon={<Clock />} text={b.hours} />

              <div className="mt-3 flex gap-2">
                <a
                  href={`https://yandex.com/maps/?text=${encodeURIComponent(
                    b.address + ", РўР°С€РєРµРЅС‚",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-pill border border-bg-ivory/15 px-4 py-2 text-[13px] font-medium text-bg-ivory active:bg-bg-ivory/10"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" /> РњР°СЂС€СЂСѓС‚
                </a>
                <Button asChild variant="pill-accent" size="default" className="flex-1">
                  <Link to="/booking" search={{ branch: b.id }}>
                    Р—Р°РїРёСЃР°С‚СЊСЃСЏ
                  </Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </section>

      <BottomNav />
    </main>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-bg-ivory/75 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-accent">
      {icon}
      {text}
    </p>
  );
}

/**
 * Embedded Yandex map (no API key needed for the public maps.yandex iframe).
 * `query` is a tilde-separated list of "address, city" strings вЂ” Yandex
 * geocodes and shows markers.
 */
function YandexMap({ query }: { query: string }) {
  // The maps.yandex.com/embed endpoint accepts a free-text query and zoom level.
  const src = `https://yandex.com/map-widget/v1/?text=${encodeURIComponent(query)}&z=11`;
  return (
    <div className="overflow-hidden rounded-[24px] border border-bg-ivory/10">
      <iframe
        src={src}
        title="РљР°СЂС‚Р° С„РёР»РёР°Р»РѕРІ Bravo"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-56 w-full"
        style={{ border: 0 }}
      />
    </div>
  );
}
