"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitProposalAction } from "@/app/(main)/jobs/actions";

export function ProposalForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitProposalAction({
        jobId,
        message: message.trim(),
        priceIDR: Math.round(Number(price)),
      });
      if (res.ok) {
        toast.success("Penawaran terkirim!");
        setMessage("");
        setPrice("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal mengirim.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Kirim penawaran</h3>
      <div className="space-y-1">
        <Label className="text-xs">Pesan ke client</Label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Perkenalkan diri & jelaskan kenapa kamu cocok untuk pekerjaan ini..."
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Harga penawaran (Rp)</Label>
        <Input
          type="number"
          min={5000}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="250000"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Kirim penawaran
      </Button>
    </form>
  );
}
