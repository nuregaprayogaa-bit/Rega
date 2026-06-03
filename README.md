# Worq

**Marketplace jasa freelance multi-vendor untuk pasar Indonesia** (referensi: Fastwork). Freelancer menjual jasa dengan paket bertingkat (Basic/Standar/Premium), client memesan dan membayar lewat **escrow** — dana baru diteruskan ke freelancer setelah hasil pekerjaan diterima.

- 🇮🇩 Bahasa Indonesia, harga **Rupiah (IDR)**, pembayaran lokal (QRIS, VA, e-wallet via Midtrans).
- 🔒 **Pembayaran escrow** + **buku besar double-entry immutable** (uang disimpan sebagai integer rupiah, bukan float).
- 📱 Desain **mobile-first**, bersih & modern.

## ✨ Fitur

### Phase 1 — MVP (✅ selesai)
- **Auth & peran**: daftar sebagai **Client** atau **Freelancer** (email/password + Google), RBAC.
- **Freelancer**: profil + keahlian, **CRUD jasa (gig)** dengan paket Basic/Standar/Premium (harga, durasi, revisi, deliverables), dashboard order masuk, **dompet & penarikan dana**.
- **Client**: landing, **browse per kategori**, **pencarian + filter** (kategori, harga, rating, durasi) + sorting, halaman detail gig dengan **tabel perbandingan paket**, profil publik freelancer.
- **Alur order + escrow**: pilih paket → checkout → bayar (sandbox/simulasi) → **dana ditahan** → freelancer kerjakan & kirim hasil → client terima → **dana rilis** ke saldo freelancer (atau **auto-accept** setelah X hari).
- **Review & rating** setelah order selesai; **level/badge** freelancer otomatis.
- **Chat per order**, **revisi** sesuai kuota paket, **sengketa** (dispute).
- **Panel admin**: moderasi penarikan dana & resolusi sengketa.
- **Seed data**: 8 kategori, beberapa freelancer + gig + ulasan demo.

### Phase 2 (✅ selesai)
- **Notifikasi**: lonceng in-app dengan badge belum-dibaca (polling near-real-time) + **email** best-effort (adapter Resend; nge-log jika belum dikonfigurasi). Terhubung ke event order, kirim hasil, selesai, revisi, pesan, ulasan, payout, & sengketa.
- **Chat real-time**: pesan per order auto-update tiap beberapa detik tanpa refresh.
- **Wishlist/Favorit**: simpan jasa (ikon hati di kartu & detail), halaman `/wishlist`.
- **Sistem revisi**, **wallet & penarikan dana**, **level/badge freelancer** — sudah aktif sejak Phase 1.

### Phase 3 (✅ selesai)
- **Panel admin lengkap**: ringkasan + **moderasi jasa** (aktif/jeda/tolak), **kelola kategori** (tambah/ubah/hapus), **manajemen pengguna** (ubah peran Client/Freelancer/Admin), plus moderasi payout & resolusi sengketa.
- **Analytics freelancer**: total & tren pendapatan 6 bulan, order aktif/selesai, tingkat penyelesaian, rating, jasa terlaris.
- **Pembayaran produksi**: tinggal set `MIDTRANS_IS_SANDBOX=false` + kunci produksi (adapter sudah siap).

### Desain
Identitas visual orisinal (bukan tiruan): palet **jade/teal + aksen coral & amber**, tipografi **Plus Jakarta Sans** (dirancang di Indonesia), logo & hero kustom.

### Integritas keuangan (non-negotiable)
- Escrow: dana ditahan sampai order diterima/auto-accept.
- Uang = **integer rupiah** (tanpa float).
- **Ledger double-entry & immutable** — koreksi lewat entri baru, bukan edit.
- **Webhook pembayaran idempotent** (anti dobel-proses).
- Operasi saldo + status order **atomic** (DB transaction).
- **State machine order** eksplisit: `PENDING_PAYMENT → IN_PROGRESS → DELIVERED → COMPLETED` (cabang `REVISION_REQUESTED`, `CANCELLED`, `DISPUTED`).

## 🧱 Tech Stack
- **Next.js 15** (App Router) + **TypeScript**
- **PostgreSQL** + **Prisma**
- **Auth.js (NextAuth v5)** — credentials + Google, RBAC
- **Tailwind CSS** + **shadcn/ui**
- **Midtrans** (sandbox) via adapter pembayaran (mudah ganti ke Xendit)
- **next-intl** (id/en) — default Bahasa Indonesia
- Object storage **S3/R2** (opsional)

## 🚀 Menjalankan secara lokal

Prasyarat: Node 18+ (lihat `.nvmrc`), PostgreSQL, dan **pnpm**.

```bash
# 1. Install dependency
pnpm install

# 2. Siapkan environment
cp .env.example .env
#   - isi DATABASE_URL (lokal atau Neon)
#   - isi AUTH_SECRET  (openssl rand -base64 32)
#   - (opsional) Midtrans/Google/S3. Tanpa Midtrans, checkout = MODE SIMULASI.

# 3. Siapkan database & data awal
pnpm db:push      # buat tabel sesuai schema
pnpm db:seed      # isi kategori, freelancer, gig & ulasan demo

# 4. Jalankan
pnpm dev          # http://localhost:3000
```

### Akun demo (password: `password123`)
| Peran | Email |
| ----- | ----- |
| Admin | `admin@worq.id` |
| Client | `client@worq.id` |
| Freelancer | `rani.desain@worq.id`, `dimas.dev@worq.id`, `sari.tulis@worq.id`, `agus.video@worq.id` |

> **Mode simulasi pembayaran:** jika `MIDTRANS_SERVER_KEY` kosong, setiap checkout langsung dianggap lunas (dana masuk escrow) — praktis untuk demo tanpa setup pembayaran.

## 📜 Skrip penting
| Perintah | Fungsi |
| -------- | ------ |
| `pnpm dev` | Jalankan mode pengembangan |
| `pnpm build` | Build produksi |
| `pnpm db:push` | Sinkronkan schema ke database |
| `pnpm db:seed` | Isi data awal |
| `pnpm db:studio` | Buka Prisma Studio (lihat data) |
| `pnpm typecheck` | Cek tipe TypeScript |

## ☁️ Deploy (Vercel + Neon)
1. Buat database gratis di [Neon](https://neon.tech), salin connection string ke `DATABASE_URL`.
2. Import repo ini ke **Vercel**, set environment variables (minimal `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`).
3. Vercel menjalankan `vercel-build` (`prisma db push` + `seed` + `build`) otomatis.
4. (Opsional) **Vercel Cron** sudah dikonfigurasi di `vercel.json` untuk menjalankan auto-accept tiap jam (set `CRON_SECRET` agar aman).

Lihat **DEPLOY.md** untuk panduan langkah-demi-langkah.

## 🗂️ Struktur singkat
```
prisma/schema.prisma        # model data (Gig, Order, LedgerEntry, dll)
prisma/seed.ts              # data awal
src/server/services/        # logika bisnis (gig, order/escrow, ledger, wallet, ...)
src/server/adapters/        # payment (Midtrans) & storage (S3) — mudah diganti
src/app/(main)/             # halaman publik + client + freelancer (/sell) + admin
src/components/             # UI (gig, order, sell, ui/shadcn)
```

## 💸 Model keuangan singkat
- Client membayar **harga paket + biaya layanan** (`BUYER_SERVICE_FEE_PERCENT`).
- Freelancer menerima **harga paket − komisi** (`PLATFORM_FEE_PERCENT`).
- Platform mendapat **biaya layanan + komisi**.
- Semua dicatat di buku besar double-entry yang selalu seimbang (debit = kredit).
