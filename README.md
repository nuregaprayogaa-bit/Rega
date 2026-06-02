# Nusagraf

**Marketplace foto & video stok untuk pasar Indonesia.** Mirip Shutterstock/Adobe Stock, tapi fokus lokal: Bahasa Indonesia, mata uang IDR, pembayaran lokal (QRIS, Virtual Account, e-wallet via Midtrans), serta kepatuhan PPN 11%.

## ✨ Fitur per Fase

| Fase | Fitur | Status |
| ---- | ----- | ------ |
| 0 | Setup proyek (Next.js, Tailwind, shadcn/ui, Prisma, i18n) | ✅ Selesai |
| 1 | Auth & peran (email/password + Google, role-based dashboard) | ⏳ Berikutnya |
| 2 | Upload kontributor (presigned upload, thumbnail + watermark) | ⏳ |
| 3 | Moderasi admin (approve/reject) | ⏳ |
| 4 | Katalog & pencarian publik | ⏳ |
| 5 | Cart & checkout (Midtrans Snap + webhook) | ⏳ |
| 6 | Akses pasca-beli (presigned download, invoice) | ⏳ |
| 7 | Dashboard kontributor (statistik + earning ledger) | ⏳ |

## 🧱 Tech Stack

- **Next.js 15** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** + **Prisma ORM**
- **Auth.js (NextAuth v5)** — email/password + Google OAuth
- **Cloudflare R2** (S3-compatible) via AWS SDK v3 — presigned upload/download
- **Midtrans Snap** — pembayaran (abstraksi `PaymentProvider`, siap swap ke Xendit)
- **Sharp** (gambar/watermark) + **ffmpeg** (preview video)
- **next-intl** — i18n (id default, en)
- **Zod** — validasi input

## 📁 Struktur Folder

```
src/
├─ app/
│  ├─ (public)/        # home, search, asset/[id]
│  ├─ (auth)/          # login, register
│  ├─ (buyer)/         # cart, checkout, downloads, orders
│  ├─ (contributor)/   # upload, dashboard kontributor
│  ├─ (admin)/         # moderasi
│  └─ api/             # auth, upload/presign, download, webhooks/midtrans
├─ components/         # ui/ (shadcn) + komponen fitur
├─ server/
│  ├─ services/        # LOGIKA BISNIS (config, asset, order, payment, earning)
│  ├─ adapters/        # storage/, payment/, media/
│  └─ db.ts            # singleton Prisma client
├─ lib/                # money (IDR), utils, constants
└─ i18n/               # konfigurasi next-intl
messages/              # id.json, en.json
prisma/                # schema.prisma, seed.ts
```

**Prinsip arsitektur:** komponen UI tidak pernah memanggil Prisma/SDK eksternal langsung. Semua melalui *service layer* di `src/server/services`. Otorisasi & cek kepemilikan file selalu divalidasi di server; **file key asli tidak pernah diekspos ke client**.

## 🚀 Setup Lokal

### Prasyarat
- Node.js 22+ (lihat `.nvmrc`)
- PostgreSQL 14+ berjalan lokal
- (Fase 2+) `ffmpeg` terpasang untuk pemrosesan video

### Langkah

```bash
# 1. Install dependencies
npm install        # atau: pnpm install

# 2. Siapkan environment
cp .env.example .env
# Edit .env: minimal isi DATABASE_URL dan AUTH_SECRET
#   AUTH_SECRET: jalankan `openssl rand -base64 32`

# 3. Buat database (jika belum ada)
createdb nusagraf   # atau lewat psql: CREATE DATABASE nusagraf;

# 4. Terapkan skema ke database
npm run db:push

# 5. Isi data contoh (kategori, lisensi, user, asset placeholder)
npm run db:seed

# 6. Jalankan dev server
npm run dev
# Buka http://localhost:3000
```

### Akun seed (password semua: `password123`)

| Peran | Email |
| ----- | ----- |
| Admin | `admin@nusagraf.id` |
| Kontributor | `kreator@nusagraf.id` |
| Pembeli | `pembeli@nusagraf.id` |

## 🔧 Script

| Perintah | Fungsi |
| -------- | ------ |
| `npm run dev` | Jalankan dev server |
| `npm run build` | Build produksi (generate Prisma + Next build) |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run lint` | ESLint |
| `npm run db:push` | Sinkronkan skema Prisma ke DB |
| `npm run db:migrate` | Buat migrasi dev |
| `npm run db:seed` | Isi data contoh |
| `npm run db:studio` | Buka Prisma Studio |

## 💰 Konfigurasi Bisnis

Nilai berikut tersimpan di tabel `AppConfig` (bisa diubah admin tanpa deploy), dengan fallback dari env:

| Key | Default | Keterangan |
| --- | ------- | ---------- |
| `PPN_PERCENT` | 11 | Tarif PPN ditampilkan terpisah di checkout |
| `PLATFORM_FEE_PERCENT` | 20 | Komisi platform; kontributor menerima 80% |
| `DOWNLOAD_URL_TTL_SECONDS` | 300 | Masa berlaku presigned URL unduhan |

## 📝 Catatan Keamanan

- Semua secret lewat `.env` (lihat `.env.example`). Tidak ada kredensial hardcoded.
- Upload kontributor masuk status `PENDING` dan wajib di-approve admin sebelum tayang.
- Publik hanya melihat versi ber-watermark / preview clip. File asli hanya via presigned URL berbatas waktu setelah pembelian sah.
