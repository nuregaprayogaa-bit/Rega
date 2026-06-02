"use server";

import { requireUser } from "@/server/auth-helpers";
import {
  createDownloadLink,
  type DownloadLinkResult,
} from "@/server/services/download-service";

export async function getDownloadLinkAction(
  assetId: string,
): Promise<DownloadLinkResult> {
  const user = await requireUser("/downloads");
  return createDownloadLink(user.id, assetId);
}
