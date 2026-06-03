import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { FREELANCER_LEVEL_LABEL } from "@/lib/constants";

const STYLES: Record<string, string> = {
  NEW: "bg-muted text-muted-foreground",
  LEVEL_1: "bg-sky-100 text-sky-700",
  LEVEL_2: "bg-violet-100 text-violet-700",
  TOP_RATED: "bg-amber-100 text-amber-700",
};

export function LevelBadge({ level, className }: { level: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[level] ?? STYLES.NEW,
        className,
      )}
    >
      {level === "TOP_RATED" && <BadgeCheck className="h-3 w-3" />}
      {FREELANCER_LEVEL_LABEL[level] ?? "Freelancer"}
    </span>
  );
}
