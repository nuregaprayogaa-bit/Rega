"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/auth-helpers";
import {
  createJob,
  submitProposal,
  acceptProposal,
  closeJob,
} from "@/server/services/job-service";
import type { JobInput, ProposalInput } from "@/lib/validations/job";

export async function createJobAction(input: JobInput) {
  const user = await requireUser();
  const res = await createJob(user.id, input);
  revalidatePath("/jobs");
  return res;
}

export async function submitProposalAction(input: ProposalInput) {
  const user = await requireUser();
  const res = await submitProposal(user.id, input);
  revalidatePath(`/jobs/${input.jobId}`);
  return res;
}

export async function acceptProposalAction(proposalId: string, jobId: string) {
  const user = await requireUser();
  const res = await acceptProposal(user.id, proposalId);
  revalidatePath(`/jobs/${jobId}`);
  return res;
}

export async function closeJobAction(jobId: string) {
  const user = await requireUser();
  const res = await closeJob(user.id, jobId);
  revalidatePath(`/jobs/${jobId}`);
  return res;
}
