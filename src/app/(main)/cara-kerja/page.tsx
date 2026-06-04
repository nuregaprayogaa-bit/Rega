import type { Metadata } from "next";
import Link from "next/link";
import { Search, CreditCard, PackageCheck, Star } from "lucide-react";

import { StaticPage } from "@/components/static/static-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Cara Kerja",
  description: "Cara memesan & menjual jasa di Worq dengan pembayaran aman escrow.",
};

const STEPS = [
  { icon: Search, title: "1. Temukan jasa", desc: "Cari jasa atau posting kebutuhanmu. Bandingkan paket, harga, dan ulasan freelancer." },
  { icon: CreditCard, title: "2. Pesan & bayar aman", desc: "Bayar lewat metode lokal. Dana ditahan di escrow Worq — belum diteruskan ke freelancer." },
  { icon: PackageCheck, title: "3. Terima hasil", desc: "Freelancer mengerjakan & mengirim hasil. Minta revisi bila perlu sesuai kuota paket." },
  { icon: Star, title: "4. Selesai & ulas", desc: "Setelah kamu setuju, dana dirilis ke freelancer. Beri ulasan untuk bantu pengguna lain." },
];

export default function CaraKerjaPage() {
  return (
    <StaticPage
      title="Cara Kerja Worq"
      lead="Aman, transparan, dan mudah — baik untuk client maupun freelancer."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl border bg-card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 text-base font-semibold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <h2>Kenapa pembayaran lewat escrow?</h2>
      <p>
        Saat kamu membayar, dana <strong>tidak langsung</strong> diberikan ke freelancer,
        melainkan <strong>ditahan oleh Worq</strong>. Dana hanya diteruskan setelah kamu
        menerima dan menyetujui hasil pekerjaan (atau otomatis setelah masa konfirmasi).
        Ini melindungi kedua belah pihak.
      </p>

      <h2>Untuk Freelancer</h2>
      <ul>
        <li>Buat jasa dengan paket Basic, Standar, dan Premium.</li>
        <li>Terima order, diskusi via chat, kirim hasil, dan tangani revisi.</li>
        <li>Penghasilan masuk ke dompet & bisa ditarik ke rekening/e-wallet.</li>
      </ul>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild><Link href="/search">Cari jasa</Link></Button>
        <Button asChild variant="outline"><Link href="/register?role=freelancer">Jadi freelancer</Link></Button>
      </div>
    </StaticPage>
  );
}
