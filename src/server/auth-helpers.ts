import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/server/auth";

/** Ambil sesi saat ini (atau null). */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Wajib login; jika tidak, redirect ke /login. */
export async function requireUser(callbackUrl = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return user;
}

/** Wajib login dengan peran tertentu; jika tidak sesuai, redirect. */
export async function requireRole(roles: Role[], callbackUrl = "/dashboard") {
  const user = await requireUser(callbackUrl);
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
}
