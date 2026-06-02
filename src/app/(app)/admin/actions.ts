"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { approveAsset, rejectAsset } from "@/server/services/moderation-service";
import { moderationSchema } from "@/lib/validations/asset";

export type ModResult = { ok: boolean; error?: string };

export async function moderateAction(input: {
  assetId: string;
  action: "APPROVE" | "REJECT";
  reason?: string;
}): Promise<ModResult> {
  const user = await requireRole(["ADMIN"], "/admin");
  const parsed = moderationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Data tidak valid" };
  }

  if (parsed.data.action === "REJECT" && !parsed.data.reason?.trim()) {
    return { ok: false, error: "Alasan penolakan wajib diisi" };
  }

  if (parsed.data.action === "APPROVE") {
    await approveAsset(parsed.data.assetId, user.id);
  } else {
    await rejectAsset(parsed.data.assetId, user.id, parsed.data.reason!.trim());
  }
  revalidatePath("/admin");
  return { ok: true };
}
