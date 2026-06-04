import type { Metadata } from "next";
import { StaticPage } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "Tentang Worq",
  description: "Worq adalah marketplace jasa freelance untuk Indonesia.",
};

export default function TentangPage() {
  return (
    <StaticPage
      title="Tentang Worq"
      lead="Menghubungkan bisnis dengan talenta freelance terbaik di Indonesia."
    >
      <p>
        <strong>Worq</strong> adalah marketplace jasa freelance multi-vendor yang dibuat
        khusus untuk pasar Indonesia. Kami mempertemukan client yang membutuhkan jasa —
        mulai dari desain, penulisan, video, hingga pengembangan web — dengan freelancer
        berbakat dari seluruh penjuru negeri.
      </p>

      <h2>Misi kami</h2>
      <p>
        Membuat transaksi jasa menjadi <strong>aman, transparan, dan terjangkau</strong>.
        Lewat sistem pembayaran escrow, kami memastikan client hanya membayar untuk hasil
        yang sesuai, dan freelancer dijamin dibayar atas kerja kerasnya.
      </p>

      <h2>Kenapa Worq?</h2>
      <ul>
        <li><strong>Lokal sepenuhnya</strong> — Bahasa Indonesia, harga Rupiah, metode pembayaran lokal.</li>
        <li><strong>Pembayaran aman</strong> — dana ditahan di escrow sampai pekerjaan diterima.</li>
        <li><strong>Harga transparan</strong> — paket bertingkat yang jelas, tanpa biaya tersembunyi.</li>
        <li><strong>Komunikasi mudah</strong> — chat langsung dan sistem revisi di setiap pesanan.</li>
      </ul>
    </StaticPage>
  );
}
