import type { Metadata } from "next";
import { StaticPage } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Bagaimana Worq mengumpulkan dan melindungi data Anda.",
};

export default function PrivasiPage() {
  return (
    <StaticPage title="Kebijakan Privasi" lead="Terakhir diperbarui: Juni 2026">
      <p>
        Privasi Anda penting bagi kami. Halaman ini menjelaskan data apa yang kami kumpulkan
        dan bagaimana kami menggunakannya.
      </p>

      <h2>Data yang kami kumpulkan</h2>
      <ul>
        <li><strong>Data akun</strong>: nama, email, dan kata sandi (disimpan dalam bentuk ter-hash).</li>
        <li><strong>Data profil</strong>: foto, bio, keahlian (untuk freelancer).</li>
        <li><strong>Data transaksi</strong>: pesanan, pesan, dan catatan keuangan.</li>
      </ul>

      <h2>Bagaimana data digunakan</h2>
      <ul>
        <li>Menjalankan layanan: memproses pesanan, pembayaran, dan komunikasi.</li>
        <li>Keamanan: mencegah penipuan dan penyalahgunaan.</li>
        <li>Notifikasi: mengirim pemberitahuan terkait aktivitas akun Anda.</li>
      </ul>

      <h2>Keamanan</h2>
      <p>
        Kata sandi disimpan ter-enkripsi (hash). Pembayaran diproses melalui penyedia
        pembayaran tepercaya. Kami menerapkan kontrol akses berbasis peran.
      </p>

      <h2>Hak Anda</h2>
      <p>
        Anda dapat memperbarui data profil kapan saja, atau menghubungi kami untuk meminta
        penghapusan akun.
      </p>

      <p className="text-xs text-muted-foreground">
        Catatan: dokumen ini adalah contoh untuk keperluan demo.
      </p>
    </StaticPage>
  );
}
