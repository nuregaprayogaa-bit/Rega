import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/30">
        <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted-foreground">
              Marketplace jasa freelance Indonesia dengan pembayaran aman (escrow).
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Untuk Client</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary">Cari jasa</Link></li>
              <li><Link href="/jobs/new" className="hover:text-primary">Posting pekerjaan</Link></li>
              <li><Link href="/orders" className="hover:text-primary">Pesanan saya</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Untuk Freelancer</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/register?role=freelancer" className="hover:text-primary">Mulai jualan jasa</Link></li>
              <li><Link href="/jobs" className="hover:text-primary">Cari pekerjaan</Link></li>
              <li><Link href="/sell/wallet" className="hover:text-primary">Dompet & penarikan</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Perusahaan</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><Link href="/tentang" className="hover:text-primary">Tentang</Link></li>
              <li><Link href="/cara-kerja" className="hover:text-primary">Cara kerja</Link></li>
              <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              <li><Link href="/kontak" className="hover:text-primary">Hubungi kami</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-primary">Syarat & ketentuan</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-primary">Kebijakan privasi</Link></li>
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
