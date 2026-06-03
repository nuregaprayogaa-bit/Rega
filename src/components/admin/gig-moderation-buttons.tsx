"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GigStatus } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setGigStatusAction } from "@/app/(main)/admin/actions";

export function GigModerationButtons({ gigId, status }: { gigId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (s: GigStatus, msg: string) =>
    startTransition(async () => {
      const res = await setGigStatusAction(gigId, s);
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error("Gagal mengubah status.");
    });

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "ACTIVE" && (
        <Button size="sm" disabled={isPending} onClick={() => run(GigStatus.ACTIVE, "Jasa diaktifkan")}>
          Aktifkan
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(GigStatus.PAUSED, "Jasa dijeda")}>
          Jeda
        </Button>
      )}
      {status !== "REJECTED" && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={() => run(GigStatus.REJECTED, "Jasa ditolak")}
        >
          Tolak
        </Button>
      )}
    </div>
  );
}
