"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPayoutAction } from "@/app/(main)/sell/wallet/actions";

export function PayoutForm({
  available,
  minPayout,
  hasAccount,
  accountLabel,
}: {
  available: number;
  minPayout: number;
  hasAccount: boolean;
  accountLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");

  const disabled = available < minPayout;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestPayoutAction({ amountIDR: Math.round(Number(amount)) });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Permintaan penarikan dikirim");
        setAmount("");
        router.refresh();
      }
    });
  }

  if (!hasAccount) {
    return (
      <div className="rounded-xl border bg-card p-5 text-center">
        <ArrowUpRight className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Belum bisa menarik dana</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tambahkan rekening/e-wallet penarikan dulu (di atas).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Tarik dana</h3>
      <p className="text-xs text-muted-foreground">Dana akan dikirim ke: {accountLabel}</p>
      {disabled ? (
        <p className="text-sm text-muted-foreground">
          Saldo minimal untuk penarikan adalah {formatIDR(minPayout)}.
        </p>
      ) : (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Jumlah (maks {formatIDR(available)})</Label>
            <Input
              type="number"
              min={minPayout}
              max={available}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(minPayout)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ajukan penarikan
          </Button>
        </>
      )}
    </form>
  );
}
