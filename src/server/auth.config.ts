import type { NextAuthConfig } from "next-auth";
import { Role } from "@prisma/client";

// Konfigurasi yang AMAN untuk Edge runtime (dipakai middleware).
// TIDAK boleh meng-import Prisma, bcrypt, atau modul khusus Node di sini.

// Awalan route yang butuh login + peran tertentu.
const ALL = [Role.CLIENT, Role.FREELANCER, Role.ADMIN];
const ROUTE_GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: [Role.ADMIN] },
  { prefix: "/sell", roles: [Role.FREELANCER, Role.ADMIN] }, // area freelancer (gig, order masuk, dompet)
  { prefix: "/dashboard", roles: ALL },
  { prefix: "/checkout", roles: ALL },
  { prefix: "/orders", roles: ALL },
];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // providers asli didaftarkan di src/server/auth.ts (runtime Node)
  callbacks: {
    // Proteksi route berbasis peran. Dijalankan di middleware (Edge).
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const guard = ROUTE_GUARDS.find((g) => pathname.startsWith(g.prefix));
      if (!guard) return true; // route publik

      if (!isLoggedIn) {
        // Arahkan ke login dengan callbackUrl.
        const loginUrl = new URL("/login", nextUrl);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
      }

      if (role && guard.roles.includes(role)) return true;

      // Login tapi peran tidak sesuai -> ke dashboard sendiri.
      return Response.redirect(new URL("/dashboard", nextUrl));
    },
    // jwt & session callback dipindah ke auth.ts (butuh tipe lengkap).
  },
} satisfies NextAuthConfig;
