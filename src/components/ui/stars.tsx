import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tampilan rating bintang (read-only). */
export function Stars({
  rating,
  size = 14,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = rating >= i - 0.25;
        return (
          <Star
            key={i}
            width={size}
            height={size}
            className={cn(
              filled ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40",
            )}
          />
        );
      })}
    </div>
  );
}

/** Ringkasan rating: bintang + angka + jumlah. */
export function RatingSummary({
  ratingAvg,
  ratingCount,
  size = 14,
  className,
}: {
  ratingAvg: number;
  ratingCount: number;
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star width={size} height={size} className="fill-accent text-accent" />
      <span className="font-semibold">{ratingAvg > 0 ? ratingAvg.toFixed(1) : "Baru"}</span>
      {ratingCount > 0 && (
        <span className="text-muted-foreground">({ratingCount})</span>
      )}
    </span>
  );
}
