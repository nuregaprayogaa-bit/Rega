"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ui/image-upload";
import { PACKAGE_TIERS, PACKAGE_TIER_LABEL, type PackageTierKey } from "@/lib/constants";
import { createGigAction, updateGigAction } from "@/app/(main)/sell/gigs/actions";
import type { GigInput } from "@/lib/validations/gig";

type PkgState = {
  tier: PackageTierKey;
  title: string;
  description: string;
  price: string;
  deliveryDays: string;
  revisions: string;
  deliverables: string; // satu per baris
};

function emptyPkg(tier: PackageTierKey): PkgState {
  return {
    tier,
    title: PACKAGE_TIER_LABEL[tier],
    description: "",
    price: "",
    deliveryDays: "3",
    revisions: "1",
    deliverables: "",
  };
}

export type GigFormInitial = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  coverImage: string;
  gallery: string[];
  packages: {
    tier: PackageTierKey;
    title: string;
    description: string;
    priceIDR: number;
    deliveryDays: number;
    revisions: number;
    deliverables: string[];
  }[];
};

export function GigForm({
  categories,
  initial,
}: {
  categories: { id: string; name: string }[];
  initial?: GigFormInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [gallery, setGallery] = useState((initial?.gallery ?? []).join("\n"));

  const [packages, setPackages] = useState<PkgState[]>(
    PACKAGE_TIERS.map((tier) => {
      const found = initial?.packages.find((p) => p.tier === tier);
      if (!found) return emptyPkg(tier);
      return {
        tier,
        title: found.title,
        description: found.description,
        price: String(found.priceIDR),
        deliveryDays: String(found.deliveryDays),
        revisions: String(found.revisions),
        deliverables: found.deliverables.join("\n"),
      };
    }),
  );

  function updatePkg(i: number, patch: Partial<PkgState>) {
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();

    // Hanya sertakan paket yang punya harga (minimal Basic wajib).
    const pkgInput = packages
      .filter((p) => p.price.trim() !== "")
      .map((p) => ({
        tier: p.tier,
        title: p.title.trim() || PACKAGE_TIER_LABEL[p.tier],
        description: p.description.trim(),
        priceIDR: Math.round(Number(p.price)),
        deliveryDays: Math.round(Number(p.deliveryDays)),
        revisions: Math.round(Number(p.revisions)),
        deliverables: p.deliverables.split("\n").map((d) => d.trim()).filter(Boolean),
      }));

    const payload: GigInput = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      coverImage: coverImage.trim(),
      gallery: gallery.split("\n").map((u) => u.trim()).filter(Boolean),
      packages: pkgInput,
    };

    startTransition(async () => {
      const res = initial
        ? await updateGigAction(initial.id, payload)
        : await createGigAction(payload);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(initial ? "Jasa diperbarui" : "Jasa berhasil dibuat!");
      router.push("/sell/gigs");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {/* Info dasar */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Informasi jasa</h2>
        <div className="space-y-2">
          <Label htmlFor="title">Judul jasa</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Saya akan membuat ..."
            required
          />
          <p className="text-xs text-muted-foreground">Mulai dengan &quot;Saya akan...&quot; agar menarik.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Kategori</Label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            placeholder="Jelaskan jasa kamu, apa yang didapat client, dan prosesnya..."
            required
          />
        </div>
      </section>

      {/* Gambar */}
      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Gambar</h2>
        <div className="space-y-2">
          <Label>Gambar sampul</Label>
          <ImageUpload value={coverImage} onChange={setCoverImage} />
          <p className="text-xs text-muted-foreground">
            Gambar utama jasamu. Boleh dikosongkan (akan pakai placeholder).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gallery">URL galeri tambahan (satu per baris, opsional)</Label>
          <Textarea
            id="gallery"
            value={gallery}
            onChange={(e) => setGallery(e.target.value)}
            rows={3}
            placeholder={"https://...\nhttps://..."}
          />
        </div>
      </section>

      {/* Paket */}
      <section className="space-y-4">
        <h2 className="font-semibold">Paket harga</h2>
        <p className="text-sm text-muted-foreground">
          Isi minimal paket Basic. Tambahkan Standar & Premium untuk pilihan lebih.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((p, i) => (
            <div key={p.tier} className="space-y-3 rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-primary">{PACKAGE_TIER_LABEL[p.tier]}</h3>
              <div className="space-y-1">
                <Label className="text-xs">Nama paket</Label>
                <Input value={p.title} onChange={(e) => updatePkg(i, { title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Deskripsi singkat</Label>
                <Textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) => updatePkg(i, { description: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Harga (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={p.price}
                  onChange={(e) => updatePkg(i, { price: e.target.value })}
                  placeholder={p.tier === "BASIC" ? "150000" : "kosongkan jika tidak dipakai"}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Hari</Label>
                  <Input
                    type="number"
                    min={1}
                    value={p.deliveryDays}
                    onChange={(e) => updatePkg(i, { deliveryDays: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Revisi</Label>
                  <Input
                    type="number"
                    min={0}
                    value={p.revisions}
                    onChange={(e) => updatePkg(i, { revisions: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Yang didapat (satu per baris)</Label>
                <Textarea
                  rows={3}
                  value={p.deliverables}
                  onChange={(e) => updatePkg(i, { deliverables: e.target.value })}
                  placeholder={"1 konsep\nFile sumber\nRevisi"}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Batal
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initial ? "Simpan perubahan" : "Publikasikan jasa"}
        </Button>
      </div>
    </form>
  );
}
