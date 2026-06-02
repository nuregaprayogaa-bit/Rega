import { PrismaClient, Role, AssetType, AssetStatus, LicenseType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIES = [
  { name: "Kuliner", slug: "kuliner" },
  { name: "Pariwisata", slug: "pariwisata" },
  { name: "UMKM", slug: "umkm" },
  { name: "Ekonomi & Bisnis", slug: "ekonomi-bisnis" },
  { name: "Alam & Pemandangan", slug: "alam-pemandangan" },
  { name: "Budaya & Tradisi", slug: "budaya-tradisi" },
  { name: "Teknologi", slug: "teknologi" },
  { name: "Pendidikan", slug: "pendidikan" },
  { name: "Kesehatan", slug: "kesehatan" },
  { name: "Transportasi", slug: "transportasi" },
];

const TAGS = [
  "nasi goreng", "pantai bali", "warung", "pasar tradisional", "batik",
  "gunung", "sawah", "jakarta", "kopi", "candi", "umkm", "petani",
  "kota", "sunset", "tradisional",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌱 Seeding Nusagraf...");

  // --- Konfigurasi bisnis ---
  const config: Record<string, string> = {
    PPN_PERCENT: process.env.PPN_PERCENT ?? "11",
    PLATFORM_FEE_PERCENT: process.env.PLATFORM_FEE_PERCENT ?? "20",
    DOWNLOAD_URL_TTL_SECONDS: process.env.DOWNLOAD_URL_TTL_SECONDS ?? "300",
  };
  for (const [key, value] of Object.entries(config)) {
    await db.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  console.log("  ✓ AppConfig");

  // --- Lisensi ---
  await db.license.upsert({
    where: { type: LicenseType.STANDARD },
    create: {
      type: LicenseType.STANDARD,
      name: "Standard",
      description: "Royalty-free untuk penggunaan umum (web, sosial media, presentasi).",
      priceMultiplier: 1.0,
    },
    update: {},
  });
  await db.license.upsert({
    where: { type: LicenseType.EXTENDED },
    create: {
      type: LicenseType.EXTENDED,
      name: "Extended",
      description: "Komersial besar & resale (merchandise, template dijual ulang).",
      priceMultiplier: 3.0,
    },
    update: {},
  });
  console.log("  ✓ License (Standard, Extended)");

  // --- Kategori ---
  for (const c of CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
  }
  console.log("  ✓ Categories");

  // --- Tag ---
  for (const name of TAGS) {
    await db.tag.upsert({
      where: { name },
      create: { name, slug: slugify(name) },
      update: {},
    });
  }
  console.log("  ✓ Tags");

  // --- Users ---
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@nusagraf.id" },
    create: { email: "admin@nusagraf.id", name: "Admin Nusagraf", role: Role.ADMIN, passwordHash },
    update: { role: Role.ADMIN },
  });
  const contributor = await db.user.upsert({
    where: { email: "kreator@nusagraf.id" },
    create: { email: "kreator@nusagraf.id", name: "Budi Kreator", role: Role.CONTRIBUTOR, passwordHash },
    update: { role: Role.CONTRIBUTOR },
  });
  await db.user.upsert({
    where: { email: "pembeli@nusagraf.id" },
    create: { email: "pembeli@nusagraf.id", name: "Siti Pembeli", role: Role.BUYER, passwordHash },
    update: {},
  });
  console.log("  ✓ Users (admin / kreator / pembeli — password: password123)");

  // --- Contoh Asset (placeholder file keys) ---
  const kuliner = await db.category.findUnique({ where: { slug: "kuliner" } });
  const pariwisata = await db.category.findUnique({ where: { slug: "pariwisata" } });

  const sampleAssets = [
    {
      title: "Nasi Goreng Spesial di Warung Kaki Lima",
      description: "Sepiring nasi goreng dengan telur mata sapi, khas warung Indonesia.",
      type: AssetType.PHOTO,
      categoryId: kuliner?.id,
      status: AssetStatus.APPROVED,
      price: 50000,
      tags: ["nasi goreng", "warung", "kuliner"],
      width: 4000,
      height: 2667,
    },
    {
      title: "Sunset di Pantai Kuta Bali",
      description: "Matahari terbenam keemasan di garis pantai Kuta.",
      type: AssetType.PHOTO,
      categoryId: pariwisata?.id,
      status: AssetStatus.APPROVED,
      price: 75000,
      tags: ["pantai bali", "sunset"],
      width: 6000,
      height: 4000,
    },
    {
      title: "Aktivitas Pasar Tradisional Pagi Hari",
      description: "Suasana ramai pedagang dan pembeli di pasar tradisional.",
      type: AssetType.PHOTO,
      categoryId: kuliner?.id,
      status: AssetStatus.PENDING,
      price: 60000,
      tags: ["pasar tradisional", "umkm"],
      width: 5000,
      height: 3333,
    },
  ];

  for (const [i, a] of sampleAssets.entries()) {
    const key = `sample/${slugify(a.title)}`;
    const asset = await db.asset.create({
      data: {
        contributorId: contributor.id,
        type: a.type,
        title: a.title,
        description: a.description,
        status: a.status,
        categoryId: a.categoryId ?? null,
        originalFileKey: `${key}/original.jpg`,
        previewFileKey: `${key}/preview.jpg`,
        watermarkedFileKey: `${key}/watermarked.jpg`,
        width: a.width,
        height: a.height,
        reviewedById: a.status === AssetStatus.APPROVED ? admin.id : null,
        reviewedAt: a.status === AssetStatus.APPROVED ? new Date() : null,
        prices: {
          create: [
            { licenseType: LicenseType.STANDARD, amountIDR: a.price },
            { licenseType: LicenseType.EXTENDED, amountIDR: a.price * 3 },
          ],
        },
        tags: {
          create: a.tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name, slug: slugify(name) },
              },
            },
          })),
        },
      },
    });
    console.log(`  ✓ Asset #${i + 1}: ${asset.title} (${a.status})`);
  }

  console.log("✅ Seed selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
