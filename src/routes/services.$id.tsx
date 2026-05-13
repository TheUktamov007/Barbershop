import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/mini/BottomNav";
import { Button } from "@/components/ui/button";
import { formatDuration, formatSum } from "@/lib/mock";
import { useStore } from "@/lib/store";
import { useLocalizeCategory } from "@/lib/localize";
import { useMasterReviews } from "@/lib/reviews-client";
import { ArrowLeft, Clock, Star, Scissors } from "lucide-react";

export const Route = createFileRoute("/services/$id")({
  head: () => ({
    meta: [
      { title: "Услуга — Bravo" },
      { name: "description", content: "Услуга в барбершопе Bravo." },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const Lcat = useLocalizeCategory();
  const { services, masters, isLoading } = useStore();
  const service = services.find((s) => s.id === id);
  if (isLoading && !service) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-deep text-bg-ivory/60">
        Загружаем…
      </div>
    );
  }
  if (!service) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-deep text-bg-ivory">
        Услуга не найдена
      </div>
    );
  }
  const availableMasters = masters.filter((m) => m.serviceIds.includes(service.id));

  return (
    <main className="mx-auto min-h-screen max-w-md bg-bg-deep pb-32 text-bg-ivory">
      <div className="relative">
        <img
          src={service.image}
          alt={service.title}
          fetchPriority="high"
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent" />
        <Link
          to="/services"
          className="absolute left-4 top-12 flex h-10 w-10 items-center justify-center rounded-pill bg-bg-deep/60 backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
        </Link>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
          <span className="caption text-accent">{Lcat(service.category)}</span>
          <h1 className="mt-2 text-[32px] font-bold leading-[1.05]">
            {service.title}
          </h1>
          <div className="mt-3 flex items-center gap-4 text-[13px] text-bg-ivory/80">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" strokeWidth={1.6} />
              {formatDuration(service.durationMin)}
            </span>
            <span className="font-semibold text-accent">
              {formatSum(service.price)}
            </span>
          </div>
        </div>
      </div>

      <section className="px-5 pt-6">
        <h2 className="text-[14px] font-semibold uppercase tracking-wider text-bg-ivory/60">
          Что входит
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-bg-ivory/85">
          {service.description}
        </p>
      </section>

      <section className="mt-8 px-5">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wider text-bg-ivory/60">
          <Scissors className="h-3.5 w-3.5 text-accent" />
          Барберы
        </h2>
        <div className="mt-3 space-y-2">
          {availableMasters.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-[20px] glass-card p-3"
            >
              <img
                src={m.image}
                alt={m.name}
                loading="lazy"
                className="h-12 w-12 rounded-pill object-cover"
              />
              <div className="flex-1">
                <p className="text-[14px] font-semibold">{m.name}</p>
                <p className="text-[12px] text-bg-ivory/60">{m.role}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                <Star className="h-3.5 w-3.5 fill-accent" />
                {m.rating}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews for the first available master (proxy for "this service"). */}
      {availableMasters[0] && (
        <ReviewList masterId={availableMasters[0].id} />
      )}

      <div className="fixed bottom-24 left-1/2 z-40 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 px-5">
        <Button asChild variant="pill-accent" size="lg" className="w-full">
          <Link to="/booking" search={{ service: service.id }}>
            Записаться · {formatSum(service.price)}
          </Link>
        </Button>
      </div>

      <BottomNav />
    </main>
  );
}

function ReviewList({ masterId }: { masterId: string }) {
  const { data: reviews } = useMasterReviews(masterId);
  if (!reviews || reviews.length === 0) return null;
  return (
    <section className="mt-8 px-5 pb-4">
      <h2 className="flex items-center gap-2 text-[14px] font-semibold uppercase tracking-wider text-bg-ivory/60">
        <Star className="h-3.5 w-3.5 text-accent fill-accent" aria-hidden="true" />
        Отзывы клиентов
      </h2>
      <div className="mt-3 space-y-2">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-[20px] glass-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold">
                {r.customerName ?? "Гость"}
              </span>
              <span className="flex items-center gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-bg-ivory/20"}`}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </div>
            {r.text && (
              <p className="mt-1.5 text-[13px] leading-relaxed text-bg-ivory/80">
                {r.text}
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-bg-ivory/40">
              {new Date(r.createdAt * 1000).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
