import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Camera, Search, Upload } from "lucide-react";

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header sederhana (placeholder Fase 0; navbar penuh menyusul) */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Camera className="h-6 w-6 text-primary" />
            <span>{t("common.appName")}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t("common.login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t("common.register")}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
        <span className="rounded-full bg-secondary px-4 py-1 text-sm text-secondary-foreground">
          {t("common.tagline")}
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          {t("home.heroTitle")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {t("home.heroSubtitle")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              {t("home.cta")}
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/register">
              <Upload className="mr-2 h-4 w-4" />
              {t("home.becomeContributor")}
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {t("common.appName")}. Dibuat untuk
          kreator Indonesia.
        </div>
      </footer>
    </main>
  );
}
