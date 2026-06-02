import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";

// Middleware memakai konfigurasi Edge-safe (tanpa Prisma/bcrypt).
// Role disimpan di JWT sehingga bisa dibaca di Edge tanpa query DB.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
