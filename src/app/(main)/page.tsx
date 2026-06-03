import Link from "next/link";
import { ShieldCheck, Wallet, MessagesSquare, Star, ArrowRight } from "lucide-react";

import { listCategories, featuredGigs } from "@/server/services/catalog-service";
import { GigCard } from "@/components/gig/gig-card";
import { CategoryIcon } from "@/components/gig/category-icon";
import { HeroSearch } from "@/components/layout/hero-search";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const POPULAR = [
  "Desain Logo",
  "Penulisan Artikel",
  "Video Editing",
  "Website",
  "Social Media",
];

export default async function HomePage() {
  const [categories, gigs] = await Promise.all([listCategories(), featuredGigs(8)]);

  return (
    <>
      {/* HERO */}
      <section className="hero-gradient text-white">
        <div className="container flex flex-col items-center gap-6 py-16 text-center md:py-24">
          <span className="rounded-full bg-white/15 px-4 py-1 text-sm backdrop-blur">
            Marketplace jasa freelance #1 untuk Indonesia
          </span>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Temukan freelancer terbaik untuk wujudkan idemu
          </h1>
          <p className="max-w-2xl text-base text-white/85 sm:text-lg">
            Desain, penulisan, video, website, dan ratusan jasa lain. Bayar aman
            lewat escrow — dana baru cair setelah pekerjaan kamu terima.
          </p>
          <div className="mt-2 flex w-full justify-center">
            <HeroSearch />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-white/80">
            <span>Populer:</span>
            {POPULAR.map((p) => (
              <Link
                key={p}
                href={`/search?q=${encodeURIComponent(p)}`}
                className="rounded-full border border-white/30 px-3 py-0.5 transition-colors hover:bg-white/10"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KATEGORI */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Jelajahi kategori</h2>
            <p className="text-muted-foreground">Pilih bidang jasa yang kamu butuhkan</p>
          </div>
          <Link href="/search" className="hidden text-sm font-medium text-primary hover:underline sm:inline">
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/search?category=${c.slug}`}
              className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary hover:bg-secondary"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <CategoryIcon name={c.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {c._count.gigs} jasa
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* GIG UNGGULAN */}
      <section className="container py-4 pb-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Jasa populer</h2>
            <p className="text-muted-foreground">Paling banyak dipesan minggu ini</p>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary hover:underline">
            Lihat semua
          </Link>
        </div>
        {gigs.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            Belum ada jasa. Jadilah freelancer pertama!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </section>

      {/* CARA KERJA / KEUNGGULAN */}
      <section className="border-y bg-muted/30">
        <div className="container grid gap-6 py-12 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Pembayaran aman (escrow)",
              desc: "Dana kamu ditahan platform dan baru diteruskan ke freelancer setelah kamu menerima hasil pekerjaan.",
            },
            {
              icon: MessagesSquare,
              title: "Komunikasi langsung",
              desc: "Diskusikan kebutuhan, kirim brief, dan minta revisi langsung di halaman pesanan.",
            },
            {
              icon: Wallet,
              title: "Harga jelas & lokal",
              desc: "Semua harga dalam Rupiah dengan paket Basic, Standar, dan Premium yang transparan.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FREELANCER */}
      <section className="container py-16">
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-10 text-center">
          <Star className="h-8 w-8 text-accent" />
          <h2 className="text-2xl font-bold">Punya keahlian? Mulai hasilkan uang</h2>
          <p className="max-w-xl text-muted-foreground">
            Buat jasa, atur paketmu sendiri, dan terima order dari seluruh Indonesia.
            Gratis untuk mulai.
          </p>
          <Button size="lg" asChild>
            <Link href="/register?role=freelancer">
              Jadi Freelancer <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
