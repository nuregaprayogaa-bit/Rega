import Link from "next/link";
import { Camera } from "lucide-react";

import { getCurrentUser } from "@/server/auth-helpers";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/layout/search-bar";
import { UserMenu } from "@/components/layout/user-menu";
import { CartButton } from "@/components/cart/cart-button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <Camera className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        <SearchBar className="mx-auto hidden w-full max-w-md md:block" />

        <nav className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/search">Jelajahi</Link>
          </Button>
          <CartButton />
          {user ? (
            <UserMenu
              name={user.name ?? null}
              email={user.email ?? null}
              image={user.image ?? null}
              role={user.role}
            />
          ) : (
            <>
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
