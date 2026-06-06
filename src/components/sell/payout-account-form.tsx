"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Landmark, Wallet, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { savePayoutAccountAction } from "@/app/(main)/sell/wallet/actions";

const BANKS = ["BCA", "Mandiri", "BNI", "BRI", "CIMB Niaga", "Permata", "BSI", "Danamon", "Lainnya"];
const EWALLETS = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja"];

export type PayoutAccountData = {
  type: "BANK" | "EWALLET";
  provider: string;
  accountName: string;
  accountNo: string;
} | null;

export function PayoutAccountForm({ initial }: { initial: PayoutAccountData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(initial === null);

  const [type, setType] = useState<"BANK" | "EWALLET">(initial?.type ?? "BANK");
  const [provider, setProvider] = useState(initial?.provider ?? "BCA");
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [accountNo, setAccountNo] = useState(initial?.accountNo ?? "");

  const options = type === "BANK" ? BANKS : EWALLETS;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await savePayoutAccountAction({ type, provider, accountName, accountNo });
      if (res?.error) toast.error(res.error);
      else {
        toast.success("Rekening penarikan disimpan");
        setEditing(false);
        router.refresh();
      }
    });
  }

  // Tampilan ringkas (sudah ada rekening, tidak sedang edit)
  if (!editing && initial) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold">Rekening penarikan</h3>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Ubah
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
            {initial.type === "BANK" ? <Landmark className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
          </span>
          <div>
            <p className="font-medium">{initial.provider}</p>
            <p className="text-sm text-muted-foreground">
              {initial.accountNo} · a.n. {initial.accountName}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">{initial ? "Ubah rekening penarikan" : "Tambah rekening penarikan"}</h3>
      <p className="text-sm text-muted-foreground">
        Ke mana penghasilanmu dikirim saat menarik dana.
      </p>

      {/* Pilih tipe */}
      <div className="grid grid-cols-2 gap-2">
        {(["BANK", "EWALLET"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setProvider(t === "BANK" ? BANKS[0]! : EWALLETS[0]!);
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border-2 py-2 text-sm font-medium",
              type === t ? "border-primary bg-secondary text-primary" : "border-border",
            )}
          >
            {t === "BANK" ? <Landmark className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
            {t === "BANK" ? "Bank" : "E-Wallet"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{type === "BANK" ? "Bank" : "E-Wallet"}</Label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Nama pemilik {type === "BANK" ? "rekening" : "akun"}</Label>
        <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Sesuai buku tabungan / akun" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">{type === "BANK" ? "Nomor rekening" : "Nomor HP / akun"}</Label>
        <Input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder={type === "BANK" ? "1234567890" : "08xxxxxxxxxx"} required />
      </div>

      <div className="flex justify-end gap-2">
        {initial && (
          <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={isPending}>
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Simpan rekening
        </Button>
      </div>
    </form>
  );
}
