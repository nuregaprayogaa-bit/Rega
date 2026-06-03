import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { APP_NAME } from "@/lib/constants";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-base font-bold">{APP_NAME}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Marketplace jasa freelance Indonesia dengan pembayaran aman (escrow).
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Untuk Client</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary">Cari jasa</Link></li>
              <li><Link href="/orders" className="hover:text-primary">Pesanan saya</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary">Dasbor</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Untuk Freelancer</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/register?role=freelancer" className="hover:text-primary">Mulai jualan jasa</Link></li>
              <li><Link href="/sell/gigs" className="hover:text-primary">Kelola jasa</Link></li>
              <li><Link href="/sell/wallet" className="hover:text-primary">Dompet & penarikan</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Tentang</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Pembayaran aman (escrow)</li>
              <li>Dukungan Bahasa Indonesia</li>
              <li>Harga Rupiah</li>
            </ul>
          </div>
        </div>
        <div className="border-t py-4">
          <p className="container text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. Dibuat untuk freelancer & bisnis Indonesia.
          </p>
        </div>
      </footer>
    </div>
  );
}
