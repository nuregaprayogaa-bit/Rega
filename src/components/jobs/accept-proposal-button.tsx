"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { acceptProposalAction } from "@/app/(main)/jobs/actions";

export function AcceptProposalButton({
  proposalId,
  jobId,
}: {
  proposalId: string;
  jobId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const res = await acceptProposalAction(proposalId, jobId);
          if (res.ok) {
            toast.success("Penawaran diterima");
            router.refresh();
          } else toast.error(res.error ?? "Gagal.");
        })
      }
    >
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Terima
    </Button>
  );
}
