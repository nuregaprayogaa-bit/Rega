import Link from "next/link";

import { getCurrentUser } from "@/server/auth-helpers";
import { Logo } from "@/components/layout/logo";
import { listNotifications, unreadCount } from "@/server/services/notification-service";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isFreelancer = user?.role === "FREELANCER" || user?.role === "ADMIN";

  const [notifItems, notifUnread] = user
    ? await Promise.all([listNotifications(user.id, 15), unreadCount(user.id)])
    : [[], 0];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <SearchBar className="mx-auto hidden w-full max-w-lg md:block" />

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/search">Jelajahi Jasa</Link>
          </Button>

          {user ? (
            <>
              {isFreelancer ? (
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/sell">Dashboard Freelancer</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/register?role=freelancer">Jadi Freelancer</Link>
                </Button>
              )}
              <NotificationBell
                initialItems={JSON.parse(JSON.stringify(notifItems))}
                initialUnread={notifUnread}
              />
              <UserMenu
                name={user.name ?? null}
                email={user.email ?? null}
                image={user.image ?? null}
                role={user.role}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/register?role=freelancer">Jadi Freelancer</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Daftar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
