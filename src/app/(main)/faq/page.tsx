import type { Metadata } from "next";
import { StaticPage } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "FAQ — Pertanyaan Umum",
  description: "Pertanyaan yang sering diajukan tentang Worq.",
};

const FAQ = [
  {
    q: "Apa itu pembayaran escrow?",
    a: "Dana yang kamu bayarkan ditahan oleh Worq, dan baru diteruskan ke freelancer setelah kamu menerima hasil pekerjaan. Ini melindungi client dan freelancer.",
  },
  {
    q: "Bagaimana cara memesan jasa?",
    a: "Cari jasa yang kamu butuhkan, pilih paket (Basic/Standar/Premium), klik Pesan, isi brief, lalu bayar. Freelancer akan mulai mengerjakan setelah pembayaran dikonfirmasi.",
  },
  {
    q: "Apa bedanya 'Pesan jasa' dan 'Posting Pekerjaan'?",
    a: "Pesan jasa = kamu membeli paket yang sudah ditawarkan freelancer. Posting Pekerjaan = kamu menulis kebutuhanmu sendiri, lalu freelancer mengirim penawaran untuk kamu pilih.",
  },
  {
    q: "Bagaimana jika hasilnya tidak sesuai?",
    a: "Kamu bisa meminta revisi sesuai kuota paket. Jika tetap tidak menemui kesepakatan, kamu bisa mengajukan sengketa dan tim kami akan meninjau.",
  },
  {
    q: "Bagaimana freelancer menerima penghasilan?",
    a: "Setelah order selesai, penghasilan masuk ke saldo dompet freelancer. Saldo dapat ditarik ke rekening bank atau e-wallet melalui menu Dompet.",
  },
  {
    q: "Apakah gratis untuk mendaftar?",
    a: "Ya. Mendaftar dan membuat jasa gratis. Worq mengambil komisi kecil dari setiap transaksi yang berhasil.",
  },
];

export default function FaqPage() {
  return (
    <StaticPage title="Pertanyaan Umum (FAQ)" lead="Hal-hal yang sering ditanyakan pengguna Worq.">
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-xl border bg-card p-4">
            <summary className="cursor-pointer list-none font-medium marker:hidden">
              <span className="flex items-center justify-between">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </StaticPage>
  );
}
