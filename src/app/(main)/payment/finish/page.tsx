import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SP = { [key: string]: string | string[] | undefined };

export default async function PaymentFinishPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const orderId = typeof sp.order_id === "string" ? sp.order_id : undefined;
  const status = typeof sp.transaction_status === "string" ? sp.transaction_status : "";

  const paid = status === "settlement" || status === "capture";
  const pending = status === "pending";

  const Icon = paid ? CheckCircle2 : pending ? Clock : XCircle;
  const iconColor = paid ? "text-success" : pending ? "text-accent" : "text-destructive";
  const title = paid
    ? "Pembayaran berhasil! 🎉"
    : pending
      ? "Pembayaran sedang diproses"
      : "Pembayaran belum selesai";
  const desc = paid
    ? "Dana kamu sudah ditahan di escrow Worq. Freelancer akan mulai mengerjakan pesananmu."
    : pending
      ? "Selesaikan pembayaran sesuai instruksi (mis. transfer VA). Status akan diperbarui otomatis setelah dana diterima."
      : "Pembayaran tidak berhasil atau dibatalkan. Kamu bisa mencoba memesan lagi.";

  return (
    <div className="container flex max-w-md flex-col items-center gap-5 py-20 text-center">
      <Icon className={`h-16 w-16 ${iconColor}`} />
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {orderId ? (
          <Button asChild>
            <Link href={`/orders/${orderId}`}>Lihat pesanan</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href="/orders">Pesanan saya</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/search">Jelajahi jasa</Link>
        </Button>
      </div>
    </div>
  );
}
