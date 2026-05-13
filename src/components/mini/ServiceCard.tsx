import { Clock } from "lucide-react";

interface Props {
  image: string;
  title: string;
  duration: string;
  price: string;
}

export function ServiceCard({ image, title, duration, price }: Props) {
  return (
    <article className="group cursor-pointer overflow-hidden rounded-[24px] bg-card text-card-foreground shadow-warm-sm transition-all hover:-translate-y-0.5 hover:shadow-warm">
      <div className="aspect-square overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3.5">
        <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
        <div className="mt-1.5 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" strokeWidth={1.6} />
            {duration}
          </span>
          <span className="font-semibold text-foreground">{price}</span>
        </div>
      </div>
    </article>
  );
}
