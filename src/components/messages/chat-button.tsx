"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { startChatAction } from "@/app/(main)/messages/actions";

export function ChatButton({
  otherUserId,
  className,
  variant = "outline",
  label = "Chat dulu",
}: {
  otherUserId: string;
  className?: string;
  variant?: "outline" | "solid";
  label?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await startChatAction(otherUserId);
          if (res.ok && res.threadId) {
            router.push(`/messages/${res.threadId}`);
          } else if ((res as { needLogin?: boolean }).needLogin) {
            router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
          } else {
            toast.error(res.error ?? "Gagal membuka chat.");
          }
        })
      }
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border hover:bg-secondary",
        className,
      )}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
      {label}
    </button>
  );
}
