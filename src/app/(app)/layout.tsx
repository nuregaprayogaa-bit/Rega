import { SiteHeader } from "@/components/layout/site-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nusagraf. Dibuat untuk kreator Indonesia.
        </div>
      </footer>
    </div>
  );
}
