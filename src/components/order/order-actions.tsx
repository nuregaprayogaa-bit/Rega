"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2, RefreshCw, Star, Flag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  acceptOrderAction,
  deliverAction,
  revisionAction,
  reviewAction,
  disputeAction,
  cancelOrderAction,
} from "@/app/(main)/orders/actions";

type Props = {
  orderId: string;
  status: string;
  role: "client" | "freelancer";
  revisionsAllowed: number;
  revisionsUsed: number;
  hasReview: boolean;
};

export function OrderActions(props: Props) {
  const { orderId, status, role, revisionsAllowed, revisionsUsed, hasReview } = props;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok?: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(success);
        router.refresh();
      }
    });
  }

  // ---- FREELANCER: kirim hasil ----
  if (role === "freelancer" && (status === "IN_PROGRESS" || status === "REVISION_REQUESTED")) {
    return <DeliveryForm orderId={orderId} isPending={isPending} onRun={run} />;
  }

  // ---- CLIENT: pesanan dikirim, tunggu konfirmasi ----
  if (role === "client" && status === "DELIVERED") {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold">Hasil sudah dikirim 🎉</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Periksa hasilnya. Jika sudah sesuai, selesaikan pesanan agar dana diteruskan ke
            freelancer. Jika belum, minta revisi.
          </p>
          <Button
            className="mt-3 w-full"
            disabled={isPending}
            onClick={() => run(() => acceptOrderAction(orderId), "Pesanan selesai!")}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Terima & Selesaikan
          </Button>
        </div>
        <RevisionForm
          orderId={orderId}
          remaining={revisionsAllowed - revisionsUsed}
          isPending={isPending}
          onRun={run}
        />
        <DisputeForm orderId={orderId} isPending={isPending} onRun={run} />
      </div>
    );
  }

  // ---- CLIENT: order selesai, beri ulasan ----
  if (role === "client" && status === "COMPLETED" && !hasReview) {
    return <ReviewForm orderId={orderId} isPending={isPending} onRun={run} />;
  }

  // ---- CLIENT: belum bayar (mode pembayaran nyata) ----
  if (role === "client" && status === "PENDING_PAYMENT") {
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Menunggu pembayaran. Selesaikan pembayaran untuk memulai pesanan.
        </p>
        <Button
          variant="outline"
          className="mt-3 w-full"
          disabled={isPending}
          onClick={() => run(() => cancelOrderAction(orderId), "Pesanan dibatalkan")}
        >
          Batalkan pesanan
        </Button>
      </div>
    );
  }

  // ---- IN_PROGRESS, sisi client: dispute tersedia ----
  if (role === "client" && (status === "IN_PROGRESS" || status === "REVISION_REQUESTED")) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          Freelancer sedang mengerjakan pesanan kamu. Kamu akan diberi tahu saat hasil dikirim.
        </div>
        <DisputeForm orderId={orderId} isPending={isPending} onRun={run} />
      </div>
    );
  }

  return null;
}

function DeliveryForm({
  orderId,
  isPending,
  onRun,
}: {
  orderId: string;
  isPending: boolean;
  onRun: (fn: () => Promise<{ ok?: boolean; error?: string }>, s: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">Kirim hasil pekerjaan</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tulis pesan dan lampirkan tautan file hasil (Google Drive, dll).
      </p>
      <div className="mt-3 space-y-3">
        <Textarea
          placeholder="Halo, ini hasil pekerjaannya..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Input
          placeholder="https://link-file-hasil.com (opsional)"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() =>
            onRun(
              () =>
                deliverAction({
                  orderId,
                  message,
                  files: fileUrl.trim() ? [fileUrl.trim()] : [],
                }),
              "Hasil terkirim!",
            )
          }
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Kirim hasil
        </Button>
      </div>
    </div>
  );
}

function RevisionForm({
  orderId,
  remaining,
  isPending,
  onRun,
}: {
  orderId: string;
  remaining: number;
  isPending: boolean;
  onRun: (fn: () => Promise<{ ok?: boolean; error?: string }>, s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  if (remaining <= 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        Kuota revisi paket sudah habis.
      </p>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-4">
      {!open ? (
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <RefreshCw className="mr-2 h-4 w-4" /> Minta revisi ({remaining} tersisa)
        </Button>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold">Minta revisi</h3>
          <Textarea
            placeholder="Jelaskan bagian yang perlu diperbaiki..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button
              className="flex-1"
              disabled={isPending}
              onClick={() => onRun(() => revisionAction({ orderId, message }), "Revisi diminta")}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewForm({
  orderId,
  isPending,
  onRun,
}: {
  orderId: string;
  isPending: boolean;
  onRun: (fn: () => Promise<{ ok?: boolean; error?: string }>, s: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="font-semibold">Beri ulasan</h3>
      <p className="mt-1 text-sm text-muted-foreground">Bagaimana pengalaman kamu?</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" onClick={() => setRating(i)}>
            <Star
              className={cn(
                "h-7 w-7",
                rating >= i ? "fill-accent text-accent" : "fill-muted text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        placeholder="Ceritakan pengalamanmu (opsional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
      />
      <Button
        className="mt-3 w-full"
        disabled={isPending}
        onClick={() => onRun(() => reviewAction({ orderId, rating, comment }), "Terima kasih atas ulasannya!")}
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Kirim ulasan
      </Button>
    </div>
  );
}

function DisputeForm({
  orderId,
  isPending,
  onRun,
}: {
  orderId: string;
  isPending: boolean;
  onRun: (fn: () => Promise<{ ok?: boolean; error?: string }>, s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <Flag className="h-3.5 w-3.5" /> Ada masalah? Ajukan sengketa
        </button>
      ) : (
        <div className="space-y-3 rounded-xl border border-destructive/30 p-4">
          <h3 className="text-sm font-semibold text-destructive">Ajukan sengketa</h3>
          <Textarea
            placeholder="Jelaskan masalah yang terjadi..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={isPending}
              onClick={() => onRun(() => disputeAction({ orderId, reason }), "Sengketa diajukan")}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajukan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
