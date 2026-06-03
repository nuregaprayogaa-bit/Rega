"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatIDR } from "@/lib/money";
import { PACKAGE_TIER_LABEL, type PackageTierKey } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkoutAction } from "@/app/(main)/gig/[slug]/actions";

export type PanelPackage = {
  id: string;
  tier: PackageTierKey;
  title: string;
  description: string;
  priceIDR: number;
  deliveryDays: number;
  revisions: number;
  deliverables: string[];
};

export function PackagePanel({
  gigId,
  packages,
  serviceFeePercent,
  canOrder,
  isLoggedIn,
}: {
  gigId: string;
  packages: PanelPackage[];
  serviceFeePercent: number;
  canOrder: boolean;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState<PackageTierKey>(packages[0]?.tier ?? "BASIC");
  const [open, setOpen] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [isPending, startTransition] = useTransition();

  const pkg = packages.find((p) => p.tier === active) ?? packages[0];
  if (!pkg) return null;

  const serviceFee = Math.round((pkg.priceIDR * serviceFeePercent) / 100);
  const total = pkg.priceIDR + serviceFee;

  function handleOrder() {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setOpen(true);
  }

  function confirmOrder() {
    startTransition(async () => {
      const res = await checkoutAction({ gigId, tier: pkg!.tier, requirements });
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      // Jika ada URL pembayaran (Midtrans), arahkan ke sana.
      if (res?.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      if (res?.orderId) {
        toast.success("Pesanan dibuat!");
        router.push(`/orders/${res.orderId}`);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Tab tier */}
      <div className="grid grid-cols-3 border-b">
        {packages.map((p) => (
          <button
            key={p.tier}
            onClick={() => setActive(p.tier)}
            className={cn(
              "px-2 py-3 text-sm font-medium transition-colors",
              active === p.tier
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PACKAGE_TIER_LABEL[p.tier]}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{pkg.title}</h3>
          <span className="text-xl font-bold">{formatIDR(pkg.priceIDR)}</span>
        </div>
        <p className="text-sm text-muted-foreground">{pkg.description}</p>

        <div className="flex gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {pkg.deliveryDays} hari
          </span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            {pkg.revisions} revisi
          </span>
        </div>

        {pkg.deliverables.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {pkg.deliverables.map((d, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}

        <Button className="w-full" size="lg" onClick={handleOrder} disabled={!canOrder}>
          {canOrder ? `Pesan (${formatIDR(total)})` : "Tidak tersedia"}
        </Button>
        {!canOrder && isLoggedIn && (
          <p className="text-center text-xs text-muted-foreground">
            Anda tidak bisa memesan jasa milik sendiri.
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi pesanan</DialogTitle>
            <DialogDescription>
              Paket {PACKAGE_TIER_LABEL[pkg.tier]} — {formatIDR(pkg.priceIDR)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Brief / kebutuhan kamu (opsional)</label>
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Jelaskan detail yang kamu inginkan agar freelancer langsung paham..."
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <Row label="Harga paket" value={formatIDR(pkg.priceIDR)} />
              <Row label={`Biaya layanan (${serviceFeePercent}%)`} value={formatIDR(serviceFee)} />
              <div className="my-1 border-t" />
              <Row label="Total bayar" value={formatIDR(total)} bold />
            </div>
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              Dana ditahan aman (escrow) & baru diteruskan ke freelancer setelah kamu
              menerima hasilnya.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={confirmOrder} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lanjut & Bayar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between py-0.5", bold && "font-semibold")}>
      <span className={cn(!bold && "text-muted-foreground")}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
