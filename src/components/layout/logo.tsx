import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/** Mark logo: badge squircle gradien jade dengan inisial brand. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex items-center justify-center rounded-[0.7rem] bg-gradient-to-br from-primary via-primary to-cyan-500 font-extrabold text-primary-foreground shadow-sm ring-1 ring-inset ring-white/20",
        className,
      )}
      aria-hidden
    >
      {/* aksen titik coral kecil untuk karakter */}
      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-highlight" />
      <span className="leading-none">{APP_NAME.charAt(0)}</span>
    </span>
  );
}

/** Logo + wordmark. */
export function Logo({
  className,
  markClassName,
  showText = true,
}: {
  className?: string;
  markClassName?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoMark className={cn("h-8 w-8 text-base", markClassName)} />
      {showText && (
        <span className="text-lg font-extrabold tracking-tight">{APP_NAME}</span>
      )}
    </span>
  );
}
