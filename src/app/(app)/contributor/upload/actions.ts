"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { createAsset, type CreateAssetResult } from "@/server/services/asset-service";
import type { CreateAssetInput } from "@/lib/validations/asset";

export async function createAssetAction(
  input: CreateAssetInput,
): Promise<CreateAssetResult> {
  const user = await requireRole(["CONTRIBUTOR", "ADMIN"], "/contributor/upload");
  const result = await createAsset(user.id, input);
  if (result.ok) {
    revalidatePath("/contributor");
  }
  return result;
}
