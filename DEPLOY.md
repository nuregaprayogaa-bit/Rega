# 🚀 Cara Test Nusagraf Secara Online (Tanpa Install Apa Pun)

Panduan ini untuk pengguna **Windows** yang ingin melihat hasilnya lewat **link di browser/HP**, tanpa menginstall Node.js atau PostgreSQL. Semua dikerjakan di browser.

Kita pakai 2 layanan gratis:

- **Neon** — database PostgreSQL gratis (cukup daftar, tidak install).
- **Vercel** — untuk menjalankan aplikasi & memberi link publik.

Total waktu: ± 15 menit. Ikuti urutannya.

---

## BAGIAN 1 — Buat Database Gratis di Neon

1. Buka **https://neon.tech** → klik **Sign up** → daftar pakai akun **GitHub** (paling cepat).
2. Setelah masuk, Neon otomatis menawarkan buat **Project**. Isi:
   - **Project name**: `nusagraf`
   - **Postgres version**: biarkan default
   - **Region**: pilih yang dekat (mis. Singapore)
   - Klik **Create project**.
3. Setelah jadi, muncul kotak **Connection string**. **PENTING:**
   - Jika ada tombol/toggle **"Pooled connection"**, **MATIKAN** (off). Kita butuh koneksi langsung agar database bisa dibuat otomatis.
   - Salin seluruh teksnya. Bentuknya seperti:
     ```
     postgresql://USER:PASSWORD@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - **Simpan teks ini di Notepad** — nanti dipakai di Vercel. Inilah `DATABASE_URL` kita.

---

## BAGIAN 2 — Deploy ke Vercel

1. Buka **https://vercel.com** → **Sign up** → pilih **Continue with GitHub**.
2. Di dashboard Vercel, klik **Add New...** → **Project**.
3. Vercel menampilkan daftar repository GitHub-mu. Cari repo **`rega`** → klik **Import**.
   - Kalau reponya tidak muncul, klik **Adjust GitHub App Permissions** dan beri akses ke repo `rega`.
4. Di halaman konfigurasi project:
   - **Framework Preset**: harus terdeteksi **Next.js** (biarkan).
   - **Root Directory**: biarkan (`./`).
   - Buka bagian **Environment Variables**, lalu tambahkan satu per satu (Name → Value, klik **Add**):

     | Name | Value |
     | ---- | ----- |
     | `DATABASE_URL` | *(tempel connection string dari Neon di Bagian 1)* |
     | `AUTH_SECRET` | *(teks acak panjang — lihat catatan di bawah)* |
     | `NEXT_PUBLIC_APP_NAME` | `Nusagraf` |
     | `NEXT_PUBLIC_DEFAULT_LOCALE` | `id` |
     | `PPN_PERCENT` | `11` |
     | `PLATFORM_FEE_PERCENT` | `20` |

     > **Cara bikin `AUTH_SECRET`:** buka **https://generate-secret.vercel.app/32** di tab baru, salin teks yang muncul, tempel sebagai value. (Hanya teks acak, tidak perlu paham isinya.)

5. **JANGAN klik Deploy dulu.** Kita perlu memastikan Vercel memakai branch yang benar:
   - Klik **Deploy** dulu (deploy pertama mungkin gagal karena branch — tidak apa-apa), **ATAU** ikuti langkah 6 di bawah agar langsung benar.

6. **Set Production Branch ke branch kita** (karena belum ada `main`):
   - Setelah project terbuat, masuk ke project → **Settings** → **Git**.
   - Di **Production Branch**, ganti isinya menjadi:
     ```
     claude/nusagraf-stock-marketplace-wINBD
     ```
   - Klik **Save**.
7. Picu deploy ulang: buka tab **Deployments** → klik titik tiga (•••) pada deployment terbaru → **Redeploy** → centang **Use existing Build Cache? (boleh tidak)** → **Redeploy**.

> Saat build, Vercel otomatis menjalankan: membuat tabel database (`prisma db push`) → mengisi data contoh (seed) → build aplikasi. Jadi kamu **tidak perlu** buka terminal sama sekali.

---

## BAGIAN 3 — Buka & Test

1. Setelah deployment berstatus **Ready** (hijau), klik tombol **Visit** atau buka URL yang diberikan, mis. `https://rega-xxxx.vercel.app`.
2. Kamu akan melihat **landing page Nusagraf** berbahasa Indonesia: judul "Temukan visual otentik Indonesia", tombol "Mulai Jelajahi" & "Jadi Kontributor".
3. Setelah ini berhasil, isi `NEXT_PUBLIC_APP_URL` di Settings → Environment Variables dengan URL Vercel-mu, lalu redeploy (opsional, untuk fase berikutnya).

> **Catatan:** di Fase 0 yang tampil baru landing page. Halaman katalog, login, upload, dst. akan muncul di fase-fase berikutnya. Database & data contoh sudah terpasang dan siap dipakai fase selanjutnya.

---

## ❓ Kalau Gagal

- **Build error "Can't reach database"**: pastikan `DATABASE_URL` dari Neon benar dan **Pooled connection dimatikan**. Salin ulang dari Neon → update env var di Vercel → Redeploy.
- **Halaman kosong / 404**: pastikan **Production Branch** = `claude/nusagraf-stock-marketplace-wINBD` (Bagian 2, langkah 6), lalu Redeploy.
- **Repo tidak muncul di Vercel**: Vercel → Settings → akun → **GitHub App permissions** → beri akses repo `rega`.

Setiap kali ada update kode baru (fase berikutnya) di-push ke branch ini, Vercel otomatis deploy ulang.
