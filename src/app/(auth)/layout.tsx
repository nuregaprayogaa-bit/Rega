import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-muted/40 px-4 py-12">
      {/* Bercak dekoratif */}
      <div className="blob absolute -left-20 -top-20 h-72 w-72 bg-primary/20" />
      <div className="blob absolute -bottom-24 -right-16 h-72 w-72 bg-highlight/20" />
      <Link href="/" className="z-10 mb-8">
        <Logo markClassName="h-9 w-9 text-lg" className="text-xl" />
      </Link>
      <div className="z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
