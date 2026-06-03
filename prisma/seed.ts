import {
  PrismaClient,
  Role,
  GigStatus,
  PackageTier,
  OrderStatus,
  FreelancerLevel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ------------------------------------------------------------
// Data referensi
// ------------------------------------------------------------
const CATEGORIES = [
  { name: "Desain Grafis", slug: "desain-grafis", icon: "Palette" },
  { name: "Penulisan & Terjemahan", slug: "penulisan-terjemahan", icon: "PenLine" },
  { name: "Video & Animasi", slug: "video-animasi", icon: "Clapperboard" },
  { name: "Digital Marketing", slug: "digital-marketing", icon: "Megaphone" },
  { name: "Web & Pemrograman", slug: "web-pemrograman", icon: "Code" },
  { name: "Bisnis & Keuangan", slug: "bisnis-keuangan", icon: "Briefcase" },
  { name: "Musik & Audio", slug: "musik-audio", icon: "Music" },
  { name: "Fotografi", slug: "fotografi", icon: "Camera" },
];

const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

const avatar = (name: string, color: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=160&bold=true`;

type GigSeed = {
  slug: string;
  title: string;
  categorySlug: string;
  cover: string;
  gallery: string[];
  description: string;
  basePrice: number; // harga paket Basic; Standard 2x, Premium 4x
  rating: number;
  reviews: { rating: number; comment: string }[];
};

type FreelancerSeed = {
  email: string;
  name: string;
  color: string;
  headline: string;
  bio: string;
  location: string;
  skills: string[];
  level: FreelancerLevel;
  completedOrders: number;
  gigs: GigSeed[];
};

const FREELANCERS: FreelancerSeed[] = [
  {
    email: "rani.desain@rega.id",
    name: "Rani Wijaya",
    color: "6366f1",
    headline: "Desainer Logo & Brand Identity",
    bio: "Desainer grafis dengan 6+ tahun pengalaman membantu UMKM dan startup Indonesia membangun identitas merek yang kuat.",
    location: "Bandung",
    skills: ["Logo", "Branding", "Adobe Illustrator", "Packaging"],
    level: FreelancerLevel.TOP_RATED,
    completedOrders: 132,
    gigs: [
      {
        slug: "desain-logo-profesional-untuk-bisnis-anda",
        title: "Saya akan membuat desain logo profesional untuk bisnis Anda",
        categorySlug: "desain-grafis",
        cover: IMG("1626785774573-4b799315345d"),
        gallery: [IMG("1611162617213-7d7a39e9b1d7"), IMG("1634942537034-2531766767d1")],
        description:
          "Butuh logo yang berkesan dan profesional? Saya bantu wujudkan identitas visual bisnis Anda.\n\nYang Anda dapatkan:\n- Konsep logo orisinal\n- File siap cetak (AI, EPS, PNG, JPG)\n- Revisi sesuai paket\n\nProses: diskusi brief → konsep → revisi → finalisasi.",
        basePrice: 150000,
        rating: 4.9,
        reviews: [
          { rating: 5, comment: "Hasilnya keren banget, sesuai brief dan cepat!" },
          { rating: 5, comment: "Komunikatif dan profesional. Recommended!" },
          { rating: 4, comment: "Bagus, revisinya juga cepat ditanggapi." },
        ],
      },
      {
        slug: "desain-feed-instagram-estetik-12-konten",
        title: "Saya akan desain feed Instagram estetik untuk brand Anda",
        categorySlug: "desain-grafis",
        cover: IMG("1611926653458-09294b3142bf"),
        gallery: [IMG("1563986768609-322da13575f3")],
        description:
          "Bikin feed Instagram brand Anda makin menarik dan konsisten. Cocok untuk UMKM, kafe, dan online shop.",
        basePrice: 200000,
        rating: 4.8,
        reviews: [{ rating: 5, comment: "Desainnya estetik, klien saya suka!" }],
      },
    ],
  },
  {
    email: "dimas.dev@rega.id",
    name: "Dimas Pratama",
    color: "0ea5e9",
    headline: "Full-stack Web Developer",
    bio: "Membangun website cepat, modern, dan mobile-friendly untuk bisnis. Spesialisasi Next.js, React, dan WordPress.",
    location: "Jakarta",
    skills: ["Next.js", "React", "WordPress", "Tailwind CSS", "Node.js"],
    level: FreelancerLevel.LEVEL_2,
    completedOrders: 41,
    gigs: [
      {
        slug: "pembuatan-website-company-profile-modern",
        title: "Saya akan membuat website company profile modern & responsif",
        categorySlug: "web-pemrograman",
        cover: IMG("1467232004584-a241de8bcf5d"),
        gallery: [IMG("1547658719-da2b51169166"), IMG("1559028012-481c04fa702d")],
        description:
          "Website company profile profesional yang membuat bisnis Anda terlihat kredibel.\n\nTermasuk: desain responsif, SEO dasar, form kontak, dan integrasi WhatsApp.",
        basePrice: 750000,
        rating: 4.7,
        reviews: [
          { rating: 5, comment: "Websitenya cepat dan rapi. Mantap!" },
          { rating: 4, comment: "Sesuai ekspektasi, pengerjaan tepat waktu." },
        ],
      },
      {
        slug: "landing-page-konversi-tinggi",
        title: "Saya akan membuat landing page yang menghasilkan konversi tinggi",
        categorySlug: "web-pemrograman",
        cover: IMG("1460925895917-afdab827c52f"),
        gallery: [],
        description:
          "Landing page yang dioptimasi untuk mengubah pengunjung jadi pelanggan. Cocok untuk campaign iklan dan peluncuran produk.",
        basePrice: 500000,
        rating: 4.6,
        reviews: [{ rating: 5, comment: "Konversi iklan saya naik signifikan!" }],
      },
    ],
  },
  {
    email: "sari.tulis@rega.id",
    name: "Sari Lestari",
    color: "f59e0b",
    headline: "Penulis Konten & SEO Copywriter",
    bio: "Menulis artikel SEO, caption, dan copywriting yang menjual. Sudah membantu 50+ brand meningkatkan trafik organik.",
    location: "Yogyakarta",
    skills: ["SEO Writing", "Copywriting", "Artikel", "Terjemahan"],
    level: FreelancerLevel.LEVEL_2,
    completedOrders: 88,
    gigs: [
      {
        slug: "penulisan-artikel-seo-friendly",
        title: "Saya akan menulis artikel SEO-friendly yang naik di Google",
        categorySlug: "penulisan-terjemahan",
        cover: IMG("1455390582262-044cdead277a"),
        gallery: [IMG("1486312338219-ce68d2c6f44d")],
        description:
          "Artikel berkualitas, riset kata kunci, dan ramah SEO untuk blog bisnis Anda. Bahasa Indonesia natural dan enak dibaca.",
        basePrice: 75000,
        rating: 4.9,
        reviews: [
          { rating: 5, comment: "Tulisannya rapi dan riset kata kuncinya bagus." },
          { rating: 5, comment: "Artikel langsung naik ranking, terima kasih!" },
        ],
      },
    ],
  },
  {
    email: "agus.video@rega.id",
    name: "Agus Setiawan",
    color: "ef4444",
    headline: "Video Editor & Motion Graphics",
    bio: "Editor video untuk konten media sosial, iklan, dan company profile. Bikin video Anda makin engaging.",
    location: "Surabaya",
    skills: ["Premiere Pro", "After Effects", "Motion Graphics", "Reels"],
    level: FreelancerLevel.LEVEL_1,
    completedOrders: 17,
    gigs: [
      {
        slug: "edit-video-reels-tiktok-viral",
        title: "Saya akan edit video Reels & TikTok yang menarik dan rapi",
        categorySlug: "video-animasi",
        cover: IMG("1574717024653-61fd2cf4d44d"),
        gallery: [IMG("1492619375914-88005aa9e8fb")],
        description:
          "Edit video pendek untuk Instagram Reels dan TikTok: transisi smooth, subtitle, musik, dan color grading.",
        basePrice: 100000,
        rating: 4.5,
        reviews: [{ rating: 5, comment: "Editannya smooth, klien saya happy!" }],
      },
    ],
  },
];

// Tarif per tier dari harga dasar.
function tierPrices(base: number) {
  return { BASIC: base, STANDARD: base * 2, PREMIUM: base * 4 };
}

function packagesFor(base: number) {
  const p = tierPrices(base);
  return [
    {
      tier: PackageTier.BASIC,
      title: "Basic",
      description: "Paket dasar untuk kebutuhan sederhana.",
      priceIDR: p.BASIC,
      deliveryDays: 3,
      revisions: 1,
      deliverables: ["1 konsep", "File standar", "Revisi 1x"],
    },
    {
      tier: PackageTier.STANDARD,
      title: "Standar",
      description: "Paling populer — keseimbangan harga & hasil.",
      priceIDR: p.STANDARD,
      deliveryDays: 5,
      revisions: 3,
      deliverables: ["2 konsep", "File standar", "Sumber file", "Revisi 3x"],
    },
    {
      tier: PackageTier.PREMIUM,
      title: "Premium",
      description: "Paket lengkap dengan prioritas & revisi maksimal.",
      priceIDR: p.PREMIUM,
      deliveryDays: 7,
      revisions: 99,
      deliverables: [
        "3 konsep",
        "File standar",
        "Sumber file",
        "Hak komersial penuh",
        "Revisi unlimited",
        "Pengerjaan prioritas",
      ],
    },
  ];
}

async function main() {
  console.log("🌱 Seeding Rega (marketplace jasa freelance)...");

  // --- Konfigurasi bisnis ---
  const config: Record<string, string> = {
    PLATFORM_FEE_PERCENT: process.env.PLATFORM_FEE_PERCENT ?? "10",
    BUYER_SERVICE_FEE_PERCENT: process.env.BUYER_SERVICE_FEE_PERCENT ?? "5",
    ORDER_AUTO_ACCEPT_DAYS: process.env.ORDER_AUTO_ACCEPT_DAYS ?? "3",
    MIN_PAYOUT_IDR: process.env.MIN_PAYOUT_IDR ?? "50000",
  };
  for (const [key, value] of Object.entries(config)) {
    await db.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
  }
  console.log("  ✓ AppConfig");

  // --- Kategori ---
  for (const c of CATEGORIES) {
    await db.category.upsert({ where: { slug: c.slug }, create: c, update: { icon: c.icon, name: c.name } });
  }
  const categoryBySlug = new Map(
    (await db.category.findMany()).map((c) => [c.slug, c.id]),
  );
  console.log("  ✓ Kategori");

  // --- Users dasar ---
  const passwordHash = await bcrypt.hash("password123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@rega.id" },
    create: { email: "admin@rega.id", name: "Admin Rega", role: Role.ADMIN, passwordHash, image: avatar("Admin Rega", "111827") },
    update: { role: Role.ADMIN },
  });
  const client = await db.user.upsert({
    where: { email: "client@rega.id" },
    create: { email: "client@rega.id", name: "Budi Santoso", role: Role.CLIENT, passwordHash, image: avatar("Budi Santoso", "16a34a") },
    update: {},
  });
  console.log("  ✓ Admin & Client (password: password123)");

  // --- Freelancer + gig + paket + review ---
  for (const f of FREELANCERS) {
    const user = await db.user.upsert({
      where: { email: f.email },
      create: {
        email: f.email,
        name: f.name,
        role: Role.FREELANCER,
        passwordHash,
        image: avatar(f.name, f.color),
        freelancerProfile: {
          create: {
            headline: f.headline,
            bio: f.bio,
            location: f.location,
            skills: f.skills,
            level: f.level,
            completedOrders: f.completedOrders,
          },
        },
        wallet: { create: { availableIDR: 0, pendingIDR: 0 } },
      },
      update: { role: Role.FREELANCER, image: avatar(f.name, f.color) },
    });

    // Pastikan profil & wallet ada (untuk update path).
    await db.freelancerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        headline: f.headline,
        bio: f.bio,
        location: f.location,
        skills: f.skills,
        level: f.level,
        completedOrders: f.completedOrders,
      },
      update: {
        headline: f.headline,
        bio: f.bio,
        location: f.location,
        skills: f.skills,
        level: f.level,
        completedOrders: f.completedOrders,
      },
    });
    await db.walletAccount.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    for (const g of f.gigs) {
      const existing = await db.gig.findUnique({ where: { slug: g.slug } });
      if (existing) {
        console.log(`    • Gig sudah ada: ${g.title}`);
        continue;
      }
      const ratingCount = g.reviews.length;
      const ratingAvg =
        ratingCount > 0
          ? Math.round((g.reviews.reduce((s, r) => s + r.rating, 0) / ratingCount) * 100) / 100
          : 0;

      const gig = await db.gig.create({
        data: {
          freelancerId: user.id,
          categoryId: categoryBySlug.get(g.categorySlug) ?? null,
          title: g.title,
          slug: g.slug,
          description: g.description,
          coverImage: g.cover,
          gallery: g.gallery,
          status: GigStatus.ACTIVE,
          ratingAvg,
          ratingCount,
          ordersCount: ratingCount + Math.floor(Math.random() * 20),
          packages: { create: packagesFor(g.basePrice) },
        },
        include: { packages: true },
      });

      // Buat order COMPLETED + review (agar rating & ulasan muncul).
      const basicPkg = gig.packages.find((p) => p.tier === PackageTier.BASIC)!;
      for (const [i, rev] of g.reviews.entries()) {
        const price = basicPkg.priceIDR;
        const serviceFee = Math.round(price * 0.05);
        const commission = Math.round(price * 0.1);
        const order = await db.order.create({
          data: {
            code: `RGA-${gig.slug.slice(0, 3).toUpperCase()}${i}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
            clientId: client.id,
            freelancerId: user.id,
            gigId: gig.id,
            packageId: basicPkg.id,
            packageTier: PackageTier.BASIC,
            status: OrderStatus.COMPLETED,
            packagePriceIDR: price,
            serviceFeeIDR: serviceFee,
            totalIDR: price + serviceFee,
            commissionIDR: commission,
            freelancerNetIDR: price - commission,
            revisionsAllowed: basicPkg.revisions,
            paidAt: new Date(),
            completedAt: new Date(),
            conversation: { create: {} },
          },
        });
        await db.review.create({
          data: {
            orderId: order.id,
            gigId: gig.id,
            freelancerId: user.id,
            clientId: client.id,
            rating: rev.rating,
            comment: rev.comment,
          },
        });
      }
      console.log(`    ✓ Gig: ${g.title} (${ratingCount} ulasan)`);
    }
  }

  console.log("✅ Seed selesai. Akun demo (password: password123):");
  console.log("   • admin@rega.id   (Admin)");
  console.log("   • client@rega.id  (Client)");
  console.log("   • rani.desain@rega.id / dimas.dev@rega.id / sari.tulis@rega.id / agus.video@rega.id (Freelancer)");
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
