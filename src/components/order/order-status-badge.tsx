import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL } from "@/lib/constants";

const STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-violet-100 text-violet-700",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-muted text-muted-foreground",
  DISPUTED: "bg-red-100 text-red-700",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
