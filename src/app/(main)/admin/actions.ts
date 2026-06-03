"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/server/auth-helpers";
import { Role, GigStatus } from "@prisma/client";
import {
  approvePayout,
  rejectPayout,
  resolveDisputeRelease,
  resolveDisputeRefund,
  setGigStatusByAdmin,
  createCategory,
  renameCategory,
  deleteCategory,
  setUserRole,
} from "@/server/services/admin-service";

const ADMIN = [Role.ADMIN];

export async function approvePayoutAction(id: string) {
  await requireRole(ADMIN);
  const res = await approvePayout(id);
  revalidatePath("/admin");
  return res;
}

export async function rejectPayoutAction(id: string) {
  await requireRole(ADMIN);
  const res = await rejectPayout(id);
  revalidatePath("/admin");
  return res;
}

export async function resolveReleaseAction(orderId: string) {
  await requireRole(ADMIN);
  const res = await resolveDisputeRelease(orderId);
  revalidatePath("/admin");
  return res;
}

export async function resolveRefundAction(orderId: string) {
  await requireRole(ADMIN);
  const res = await resolveDisputeRefund(orderId);
  revalidatePath("/admin");
  return res;
}

// ---- Moderasi jasa ----
export async function setGigStatusAction(gigId: string, status: GigStatus) {
  await requireRole(ADMIN);
  const res = await setGigStatusByAdmin(gigId, status);
  revalidatePath("/admin/gigs");
  return res;
}

// ---- Kategori ----
export async function createCategoryAction(name: string, icon?: string) {
  await requireRole(ADMIN);
  const res = await createCategory(name, icon);
  revalidatePath("/admin/categories");
  return res;
}

export async function renameCategoryAction(id: string, name: string) {
  await requireRole(ADMIN);
  const res = await renameCategory(id, name);
  revalidatePath("/admin/categories");
  return res;
}

export async function deleteCategoryAction(id: string) {
  await requireRole(ADMIN);
  const res = await deleteCategory(id);
  revalidatePath("/admin/categories");
  return res;
}

// ---- User ----
export async function setUserRoleAction(userId: string, role: Role) {
  await requireRole(ADMIN);
  const res = await setUserRole(userId, role);
  revalidatePath("/admin/users");
  return res;
}
