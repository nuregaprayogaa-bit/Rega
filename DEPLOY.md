# 🚀 Cara Online-kan Rega (Tanpa Install Apa Pun)

Panduan ini untuk melihat aplikasi lewat **link di browser/HP**, tanpa menginstall Node.js atau PostgreSQL. Semua dikerjakan di browser. **Tidak perlu ngoding.**

Kita pakai 2 layanan **gratis**:
- **Neon** — database PostgreSQL gratis.
- **Vercel** — menjalankan aplikasi & memberi link publik.

⏱️ Total ± 15 menit. Ikuti urutannya.

---

## BAGIAN 1 — Buat Database Gratis di Neon

1. Buka **https://neon.tech** → **Sign up** → daftar pakai akun **GitHub** (paling cepat).
2. Buat **Project** baru:
   - **Project name**: `rega`
   - **Region**: pilih yang dekat (mis. **Singapore**)
   - Klik **Create project**.
3. Muncul kotak **Connection string**. **PENTING:**
   - Jika ada toggle **"Pooled connection"**, **MATIKAN (off)** — kita butuh koneksi langsung agar tabel bisa dibuat otomatis.
   - **Salin** seluruh teksnya, bentuknya seperti:
     ```
     postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Simpan di Notepad. Ini `DATABASE_URL` kita.

---

## BAGIAN 2 — Deploy ke Vercel

1. Buka **https://vercel.com** → **Sign up** → **Continue with GitHub**.
2. Di dashboard, klik **Add New...** → **Project**.
3. Cari repo **`Rega`** → klik **Import**.
   - Kalau tidak muncul, klik **Adjust GitHub App Permissions** dan beri akses ke repo `Rega`.
4. **Sebelum deploy, set branch yang benar:**
   - Di bagian atas konfigurasi ada pilihan **Branch**. Pilih:
     ```
     claude/fastwork-marketplace-mvp-b0Wo8
     ```
   - (Jika pilihan branch tidak terlihat di sini, lanjut deploy lalu atur di **Settings → Git → Production Branch** seperti Bagian 4.)
5. **Framework Preset** akan terdeteksi **Next.js** (biarkan). **Root Directory** biarkan (`./`).
6. Buka **Environment Variables**, tambahkan (Name → Value, klik **Add**):

   | Name | Value |
   | ---- | ----- |
   | `DATABASE_URL` | *(tempel connection string dari Neon di Bagian 1)* |
   | `AUTH_SECRET` | *(teks acak panjang — lihat catatan)* |
   | `NEXT_PUBLIC_APP_NAME` | `Rega` |

   > **Cara bikin `AUTH_SECRET`:** buka **https://generate-secret.vercel.app/32** di tab baru, salin teks yang muncul, tempel sebagai value. (Cukup teks acak.)

   Variabel lain **opsional** (sudah ada nilai default): `PLATFORM_FEE_PERCENT` (10), `BUYER_SERVICE_FEE_PERCENT` (5), `ORDER_AUTO_ACCEPT_DAYS` (3). Pembayaran Midtrans juga opsional — tanpa itu, checkout berjalan **mode simulasi** (langsung lunas), pas untuk demo.

7. Klik **Deploy**. Tunggu sampai selesai (± 2–4 menit).

> Saat build, Vercel otomatis: membuat tabel database → mengisi data contoh (kategori, freelancer, gig, ulasan) → build aplikasi. Tidak perlu buka terminal.

---

## BAGIAN 3 — Buka & Coba

1. Setelah status **Ready** (hijau), klik **Visit** atau buka URL-nya (mis. `https://rega-xxxx.vercel.app`).
2. Kamu akan melihat **landing page Rega**: hero "Temukan freelancer terbaik...", kategori, dan jasa populer.
3. Login pakai **akun demo** (password: `password123`):
   | Peran | Email |
   | ----- | ----- |
   | Client | `client@rega.id` |
   | Freelancer | `rani.desain@rega.id` |
   | Admin | `admin@rega.id` |
4. Coba alurnya: cari jasa → buka detail → **Pesan** (mode simulasi langsung lunas) → buka **Pesanan Saya** → (login sebagai freelancer) kirim hasil → (kembali sebagai client) **Terima & Selesaikan** → beri ulasan.

---

## BAGIAN 4 — Kalau Branch Belum Benar

Jika halaman 404 / kosong, kemungkinan Production Branch belum diset:
1. Buka project di Vercel → **Settings** → **Git**.
2. **Production Branch** → isi:
   ```
   claude/fastwork-marketplace-mvp-b0Wo8
   ```
   → **Save**.
3. **Deployments** → titik tiga (•••) pada deployment terbaru → **Redeploy**.

---

## ❓ Troubleshooting

- **Build error "Can't reach database"** → pastikan `DATABASE_URL` benar & **Pooled connection dimatikan** di Neon. Perbarui env var → **Redeploy**.
- **Tidak bisa login / sesi error** → pastikan `AUTH_SECRET` sudah diisi (tidak boleh kosong).
- **Repo tidak muncul di Vercel** → Vercel → **Settings → GitHub App permissions** → beri akses repo `Rega`.
- **Mau pembayaran sungguhan (sandbox)** → tambahkan `MIDTRANS_SERVER_KEY` & `MIDTRANS_CLIENT_KEY` dari dashboard Midtrans, lalu Redeploy.

Setiap kali ada update kode baru di-push ke branch ini, Vercel **otomatis deploy ulang**.
