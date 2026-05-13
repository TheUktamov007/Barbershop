import {
  Clock,
  Scissors,
  Users as UsersIcon,
  Brush,
  Baby,
  Palette,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

interface Props {
  image: string;
  title: string;
  duration: string;
  price: string;
  category?: string;
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  haircut: Scissors,
  beard: UsersIcon,
  shave: Brush,
  kids: Baby,
  coloring: Palette,
  styling: Sparkles,
  combo: Star,
};

export function ServiceCard({ image, title, duration, price, category }: Props) {
  const Icon = category ? CATEGORY_ICON[category] : undefined;
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
        {Icon && (
          <span
            aria-hidden
            className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-bg-deep/75 text-accent backdrop-blur-md ring-1 ring-bg-ivory/15"
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
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
