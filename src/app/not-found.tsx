import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Link href="/">
        <Logo markClassName="h-10 w-10 text-xl" className="text-2xl" />
      </Link>
      <div>
        <p className="text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-2 text-xl font-bold">Halaman tidak ditemukan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Maaf, halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild><Link href="/">Kembali ke beranda</Link></Button>
        <Button asChild variant="outline"><Link href="/search">Jelajahi jasa</Link></Button>
      </div>
    </div>
  );
}
