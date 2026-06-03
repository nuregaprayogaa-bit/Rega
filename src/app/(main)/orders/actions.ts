"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/auth-helpers";
import {
  acceptOrder,
  submitDelivery,
  requestRevision,
  cancelUnpaidOrder,
} from "@/server/services/order-service";
import { createReview } from "@/server/services/review-service";
import { sendMessage, openDispute } from "@/server/services/message-service";
import type {
  DeliveryInput,
  RevisionInput,
  MessageInput,
  DisputeInput,
} from "@/lib/validations/order";
import type { ReviewInput } from "@/lib/validations/review";

type Result = { ok?: boolean; error?: string };

export async function acceptOrderAction(orderId: string): Promise<Result> {
  const user = await requireUser();
  const res = await acceptOrder(user.id, orderId);
  revalidatePath(`/orders/${orderId}`);
  return res;
}

export async function deliverAction(input: DeliveryInput): Promise<Result> {
  const user = await requireUser();
  const res = await submitDelivery(user.id, input);
  revalidatePath(`/orders/${input.orderId}`);
  return res;
}

export async function revisionAction(input: RevisionInput): Promise<Result> {
  const user = await requireUser();
  const res = await requestRevision(user.id, input);
  revalidatePath(`/orders/${input.orderId}`);
  return res;
}

export async function reviewAction(input: ReviewInput): Promise<Result> {
  const user = await requireUser();
  const res = await createReview(user.id, input);
  revalidatePath(`/orders/${input.orderId}`);
  return res;
}

export async function messageAction(input: MessageInput): Promise<Result> {
  const user = await requireUser();
  const res = await sendMessage(user.id, input);
  revalidatePath(`/orders/${input.orderId}`);
  return res;
}

export async function disputeAction(input: DisputeInput): Promise<Result> {
  const user = await requireUser();
  const res = await openDispute(user.id, input);
  revalidatePath(`/orders/${input.orderId}`);
  return res;
}

export async function cancelOrderAction(orderId: string): Promise<Result> {
  const user = await requireUser();
  const res = await cancelUnpaidOrder(user.id, orderId);
  revalidatePath(`/orders/${orderId}`);
  return res;
}
