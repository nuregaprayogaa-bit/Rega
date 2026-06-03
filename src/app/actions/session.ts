"use server";

import { cookies } from "next/headers";
import { signOut } from "@/server/auth";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function setLocaleAction(locale: string) {
  if (!SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])) return;
  const store = await cookies();
  store.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
