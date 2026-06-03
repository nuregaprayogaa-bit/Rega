"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleGigStatusAction, deleteGigAction } from "@/app/(main)/sell/gigs/actions";

export function GigRowActions({ gigId, status }: { gigId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isPaused = status === "PAUSED";

  return (
    <div className="flex items-center gap-1">
      <Button asChild size="sm" variant="ghost">
        <Link href={`/sell/gigs/${gigId}/edit`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      {(status === "ACTIVE" || status === "PAUSED") && (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const res = await toggleGigStatusAction(gigId, !isPaused);
              if (res?.error) toast.error(res.error);
              else {
                toast.success(isPaused ? "Jasa diaktifkan" : "Jasa dijeda");
                router.refresh();
              }
            })
          }
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Hapus jasa ini? Tindakan tidak bisa dibatalkan.")) return;
          startTransition(async () => {
            const res = await deleteGigAction(gigId);
            if (res?.error) toast.error(res.error);
            else {
              toast.success("Jasa dihapus");
              router.refresh();
            }
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
