"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/server/auth-helpers";
import { toggleWishlist } from "@/server/services/wishlist-service";

export async function toggleWishlistAction(
  gigId: string,
): Promise<{ ok: boolean; wishlisted?: boolean; needLogin?: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needLogin: true };
  const res = await toggleWishlist(user.id, gigId);
  revalidatePath("/wishlist");
  return { ok: true, wishlisted: res.wishlisted };
}
