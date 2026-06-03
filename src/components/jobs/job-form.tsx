"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJobAction } from "@/app/(main)/jobs/actions";

export function JobForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createJobAction({
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || null,
        budgetMinIDR: budgetMin ? Math.round(Number(budgetMin)) : undefined,
        budgetMaxIDR: budgetMax ? Math.round(Number(budgetMax)) : undefined,
      });
      if (res.ok && res.jobId) {
        toast.success("Pekerjaan diposting!");
        router.push(`/jobs/${res.jobId}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Gagal memposting.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="title">Judul pekerjaan</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="mis. Butuh desain logo untuk kedai kopi"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Kategori</Label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Pilih kategori (opsional)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi kebutuhan</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Jelaskan detail pekerjaan, hasil yang diinginkan, dan tenggat waktu..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="bmin">Anggaran min (Rp)</Label>
          <Input id="bmin" type="number" min={0} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="100000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bmax">Anggaran maks (Rp)</Label>
          <Input id="bmax" type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="500000" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Posting pekerjaan
        </Button>
      </div>
    </form>
  );
}
