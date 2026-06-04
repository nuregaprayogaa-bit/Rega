import type { Metadata } from "next";
import { StaticPage } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan platform Worq.",
};

export default function SyaratPage() {
  return (
    <StaticPage title="Syarat & Ketentuan" lead="Terakhir diperbarui: Juni 2026">
      <p>
        Dengan menggunakan Worq (&quot;Platform&quot;), Anda menyetujui syarat berikut.
        Mohon dibaca dengan saksama. Dokumen ini adalah ringkasan umum dan dapat
        diperbarui sewaktu-waktu.
      </p>

      <h2>1. Akun</h2>
      <ul>
        <li>Anda wajib memberikan informasi yang benar saat mendaftar dan menjaga kerahasiaan kata sandi.</li>
        <li>Anda bertanggung jawab atas seluruh aktivitas pada akun Anda.</li>
      </ul>

      <h2>2. Peran Pengguna</h2>
      <ul>
        <li><strong>Client</strong> memesan jasa atau memposting pekerjaan.</li>
        <li><strong>Freelancer</strong> menawarkan jasa dan mengerjakan pesanan.</li>
      </ul>

      <h2>3. Transaksi & Escrow</h2>
      <ul>
        <li>Pembayaran client ditahan dalam sistem escrow Worq.</li>
        <li>Dana diteruskan ke freelancer setelah pesanan diselesaikan atau auto-accept.</li>
        <li>Worq mengenakan biaya layanan dan komisi yang ditampilkan secara transparan.</li>
      </ul>

      <h2>4. Larangan</h2>
      <ul>
        <li>Dilarang melakukan transaksi di luar platform untuk menghindari biaya/escrow.</li>
        <li>Dilarang mengunggah konten ilegal, melanggar hak cipta, atau menipu.</li>
        <li>Pelanggaran dapat berakibat penangguhan akun.</li>
      </ul>

      <h2>5. Sengketa</h2>
      <p>
        Jika terjadi perselisihan, salah satu pihak dapat mengajukan sengketa. Tim Worq
        akan meninjau bukti dari kedua pihak dan memutuskan pelepasan atau pengembalian dana.
      </p>

      <h2>6. Batasan Tanggung Jawab</h2>
      <p>
        Worq adalah perantara. Kualitas hasil pekerjaan merupakan tanggung jawab freelancer.
        Worq tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan platform.
      </p>

      <p className="text-xs text-muted-foreground">
        Catatan: dokumen ini adalah contoh untuk keperluan demo. Untuk penggunaan komersial,
        konsultasikan dengan penasihat hukum.
      </p>
    </StaticPage>
  );
}
