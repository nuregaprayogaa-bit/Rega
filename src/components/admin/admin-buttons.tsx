"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  approvePayoutAction,
  rejectPayoutAction,
  resolveReleaseAction,
  resolveRefundAction,
} from "@/app/(main)/admin/actions";

export function PayoutButtons({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean }>, msg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error("Gagal memproses.");
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={() => run(() => approvePayoutAction(id), "Payout disetujui")}>
        Setujui
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => rejectPayoutAction(id), "Payout ditolak")}>
        Tolak
      </Button>
    </div>
  );
}

export function DisputeButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean }>, msg: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(msg);
        router.refresh();
      } else toast.error("Gagal memproses.");
    });

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={isPending} onClick={() => run(() => resolveReleaseAction(orderId), "Dana dirilis ke freelancer")}>
        Menangkan freelancer
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => resolveRefundAction(orderId), "Dana dikembalikan ke client")}>
        Refund client
      </Button>
    </div>
  );
}
