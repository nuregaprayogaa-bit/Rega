"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { formatIDR } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { moderateAction } from "@/app/(app)/admin/actions";

export type PendingAsset = {
  id: string;
  title: string;
  description: string | null;
  type: "PHOTO" | "VIDEO";
  previewUrl: string;
  priceStandard: number;
  categoryName: string | null;
  contributorName: string | null;
  sensitiveFlags: string[];
  createdAt: string;
};

export function ModerationCard({ asset }: { asset: PendingAsset }) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  function approve() {
    startTransition(async () => {
      const res = await moderateAction({ assetId: asset.id, action: "APPROVE" });
      if (res.ok) toast.success("Karya disetujui");
      else toast.error(res.error ?? "Gagal");
    });
  }

  function reject() {
    if (!reason.trim()) {
      toast.error("Isi alasan penolakan");
      return;
    }
    startTransition(async () => {
      const res = await moderateAction({
        assetId: asset.id,
        action: "REJECT",
        reason,
      });
      if (res.ok) {
        toast.success("Karya ditolak");
        setOpen(false);
      } else toast.error(res.error ?? "Gagal");
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={asset.previewUrl}
          alt={asset.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
        <Badge className="absolute left-2 top-2" variant="secondary">
          {asset.type === "VIDEO" ? "Video" : "Foto"}
        </Badge>
      </div>
      <CardContent className="space-y-2 p-4">
        <Link href={`/asset/${asset.id}`} className="font-medium hover:text-primary">
          {asset.title}
        </Link>
        {asset.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {asset.description}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {asset.categoryName && <Badge variant="outline">{asset.categoryName}</Badge>}
          <Badge variant="outline">{formatIDR(asset.priceStandard)}</Badge>
          {asset.sensitiveFlags.map((f) => (
            <Badge key={f} variant="warning">
              ⚠ {f}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          oleh {asset.contributorName ?? "—"} ·{" "}
          {new Date(asset.createdAt).toLocaleDateString("id-ID")}
        </p>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1" onClick={approve} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Setujui
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex-1" disabled={isPending}>
                <X className="h-4 w-4" /> Tolak
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tolak karya</DialogTitle>
                <DialogDescription>
                  Beri alasan penolakan. Alasan ini akan terlihat oleh kontributor.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="cth: Kualitas gambar kurang tajam / mengandung watermark pihak lain."
                rows={4}
              />
              <DialogFooter>
                <Button variant="destructive" onClick={reject} disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Tolak Karya
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
