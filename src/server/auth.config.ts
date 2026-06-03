import type { NextAuthConfig } from "next-auth";

// Konfigurasi yang AMAN untuk Edge runtime (dipakai middleware).
// TIDAK boleh meng-import Prisma, bcrypt, atau modul khusus Node di sini —
// import @prisma/client akan membengkakkan bundle Edge (>1MB). Karena itu
// peran ditulis sebagai literal string, bukan enum Role dari Prisma.

type RoleName = "CLIENT" | "FREELANCER" | "ADMIN";

// Awalan route yang butuh login + peran tertentu.
const ALL: RoleName[] = ["CLIENT", "FREELANCER", "ADMIN"];
const ROUTE_GUARDS: { prefix: string; roles: RoleName[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/sell", roles: ["FREELANCER", "ADMIN"] }, // area freelancer (gig, order masuk, dompet)
  { prefix: "/dashboard", roles: ALL },
  { prefix: "/checkout", roles: ALL },
  { prefix: "/orders", roles: ALL },
];

export const authConfig = {
  // Percayai host dari header (aman di Vercel & platform lain) agar login/redirect
  // bekerja tanpa harus mengeset AUTH_URL secara manual.
  trustHost: true,
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
