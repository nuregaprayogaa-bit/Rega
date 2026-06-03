"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { Role } from "@prisma/client";
import {
  approvePayout,
  rejectPayout,
  resolveDisputeRelease,
  resolveDisputeRefund,
} from "@/server/services/admin-service";

export async function approvePayoutAction(id: string) {
  await requireRole([Role.ADMIN]);
  const res = await approvePayout(id);
  revalidatePath("/admin");
  return res;
}

export async function rejectPayoutAction(id: string) {
  await requireRole([Role.ADMIN]);
  const res = await rejectPayout(id);
  revalidatePath("/admin");
  return res;
}

export async function resolveReleaseAction(orderId: string) {
  await requireRole([Role.ADMIN]);
  const res = await resolveDisputeRelease(orderId);
  revalidatePath("/admin");
  return res;
}

export async function resolveRefundAction(orderId: string) {
  await requireRole([Role.ADMIN]);
  const res = await resolveDisputeRefund(orderId);
  revalidatePath("/admin");
  return res;
}
