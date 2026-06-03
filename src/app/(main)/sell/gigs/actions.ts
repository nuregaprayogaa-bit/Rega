"use server";

import { revalidatePath } from "next/cache";
import { GigStatus } from "@prisma/client";

import { requireRole } from "@/server/auth-helpers";
import {
  createGig,
  updateGig,
  setGigStatus,
  deleteGig,
} from "@/server/services/gig-service";
import { Role } from "@prisma/client";
import type { GigInput } from "@/lib/validations/gig";

const FREELANCER = [Role.FREELANCER, Role.ADMIN];

export async function createGigAction(input: GigInput) {
  const user = await requireRole(FREELANCER);
  const res = await createGig(user.id, input);
  revalidatePath("/sell/gigs");
  return res.ok ? { ok: true } : { error: res.error };
}

export async function updateGigAction(gigId: string, input: GigInput) {
  const user = await requireRole(FREELANCER);
  const res = await updateGig(user.id, gigId, input);
  revalidatePath("/sell/gigs");
  return res.ok ? { ok: true } : { error: res.error };
}

export async function toggleGigStatusAction(gigId: string, pause: boolean) {
  const user = await requireRole(FREELANCER);
  const res = await setGigStatus(user.id, gigId, pause ? GigStatus.PAUSED : GigStatus.ACTIVE);
  revalidatePath("/sell/gigs");
  return res.ok ? { ok: true } : { error: "Gagal mengubah status." };
}

export async function deleteGigAction(gigId: string) {
  const user = await requireRole(FREELANCER);
  const res = await deleteGig(user.id, gigId);
  revalidatePath("/sell/gigs");
  return res.ok ? { ok: true } : { error: res.error };
}
