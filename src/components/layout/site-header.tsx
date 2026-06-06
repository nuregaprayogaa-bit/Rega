import Link from "next/link";

import { getCurrentUser } from "@/server/auth-helpers";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BecomeFreelancerButton } from "@/components/layout/become-freelancer-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isFreelancer = user?.role === "FREELANCER" || user?.role === "ADMIN";
  const isClient = user?.role === "CLIENT";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-3">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <SearchBar className="mx-auto hidden w-full max-w-lg md:block" />

        {/* Navigasi desktop */}
        <nav className="hidden shrink-0 items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/search">Jelajahi Jasa</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/jobs">Cari Pekerjaan</Link>
          </Button>
          {user && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/jobs/new">Posting Pekerjaan</Link>
            </Button>
          )}

          {user ? (
            <>
              {isFreelancer && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/sell">Dashboard Freelancer</Link>
                </Button>
              )}
              {isClient && (
                <BecomeFreelancerButton className="h-8 rounded-md px-3 text-xs text-primary hover:bg-secondary">
                  Jadi Freelancer
                </BecomeFreelancerButton>
              )}
            </>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/register?role=freelancer">Jadi Freelancer</Link>
            </Button>
          )}
        </nav>

        {/* Aksi kanan */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          {user ? (
            <>
              <NotificationBell initialItems={[]} initialUnread={0} />
              <UserMenu
                name={user.name ?? null}
                email={user.email ?? null}
                image={user.image ?? null}
                role={user.role}
              />
            </>
          ) : (
            <div className="hidden items-center gap-1 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Daftar</Link>
              </Button>
            </div>
          )}

          <MobileNav loggedIn={!!user} isFreelancer={isFreelancer} isClient={isClient} />
        </div>
      </div>
    </header>
  );
}
