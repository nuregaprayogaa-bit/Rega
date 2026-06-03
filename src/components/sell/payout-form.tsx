"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPayoutAction } from "@/app/(main)/sell/wallet/actions";

export function PayoutForm({ available, minPayout }: { available: number; minPayout: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNo, setAccountNo] = useState("");

  const disabled = available < minPayout;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestPayoutAction({
        amountIDR: Math.round(Number(amount)),
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNo: accountNo.trim(),
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Permintaan penarikan dikirim");
        setAmount("");
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Tarik dana</h3>
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
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Bank / e-wallet</Label>
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA / GoPay" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">No. rekening</Label>
              <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nama pemilik rekening</Label>
            <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
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
