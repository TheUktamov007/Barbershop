import { Clock } from "lucide-react";

interface Props {
  image: string;
  title: string;
  duration: string;
  price: string;
  category?: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  haircut: "✂️",
  beard: "🧔",
  shave: "🪒",
  kids: "👦",
  coloring: "🎨",
  styling: "💈",
  combo: "⭐",
};

export function ServiceCard({ image, title, duration, price, category }: Props) {
  const emoji = category ? CATEGORY_EMOJI[category] : undefined;
  return (
    <article className="group relative cursor-pointer overflow-hidden rounded-[22px] bg-card text-card-foreground shadow-warm-sm transition-all hover:-translate-y-0.5 hover:shadow-warm ring-1 ring-bg-ivory/5">
      <div className="aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {emoji && (
          <span
            aria-hidden
            className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg-deep/70 text-[15px] backdrop-blur-md ring-1 ring-bg-ivory/15"
          >
            {emoji}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="text-[14px] font-semibold leading-tight line-clamp-2">{title}</h3>
        <div className="mt-1.5 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.7} />
            {duration}
          </span>
          <span className="font-bold text-accent-dark">{price}</span>
        </div>
      </div>
    </article>
  );
}
