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
    // PENTING: di middleware (Edge), `auth.user` hanya berisi field default.
    // Tanpa session callback ini, `auth.user.role` undefined -> guard /dashboard
    // gagal dan menyebabkan REDIRECT LOOP. Callback ini Edge-safe (tanpa DB):
    // hanya menyalin role & id dari token JWT yang sudah dibuat saat login.
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        const role = token.role as unknown as RoleName | undefined;
        if (role) (session.user as { role: RoleName }).role = role;
      }
      return session;
    },
    // Proteksi route berbasis peran. Dijalankan di middleware (Edge).
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role as RoleName | undefined;
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

      // Login & peran cocok -> izinkan. (Jika role belum termuat, jangan
      // memblokir route untuk semua peran agar tidak terjadi redirect loop.)
      if (role && guard.roles.includes(role)) return true;
      if (!role && guard.roles.length === 3) return true; // route untuk semua peran

      // Login tapi peran tidak sesuai -> ke dashboard sendiri.
      if (pathname.startsWith("/dashboard")) return true; // jangan loop ke diri sendiri
      return Response.redirect(new URL("/dashboard", nextUrl));
    },
  },
} satisfies NextAuthConfig;
