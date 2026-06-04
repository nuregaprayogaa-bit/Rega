import type { Metadata } from "next";
import { Mail, MessageCircle, Clock } from "lucide-react";

import { StaticPage } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "Hubungi Kami",
  description: "Hubungi tim dukungan Worq.",
};

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@worq.id";

export default function KontakPage() {
  return (
    <StaticPage title="Hubungi Kami" lead="Ada pertanyaan atau kendala? Tim kami siap membantu.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="mt-2 text-base font-semibold">Email</h2>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h2 className="mt-2 text-base font-semibold">Bantuan dalam pesanan</h2>
          <p className="text-sm text-muted-foreground">
            Untuk masalah pada pesanan tertentu, gunakan fitur <strong>chat</strong> di halaman
            pesanan, atau ajukan <strong>sengketa</strong> agar ditinjau tim kami.
          </p>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" /> Jam operasional dukungan: Senin–Jumat, 09.00–18.00 WIB.
      </p>
    </StaticPage>
  );
}
