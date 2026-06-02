"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAssetAction } from "@/app/(app)/contributor/upload/actions";

type Category = { name: string; slug: string };
const SENSITIVE = [
  { value: "SARA", label: "SARA" },
  { value: "POLITIK", label: "Politik" },
  { value: "DEWASA", label: "Dewasa" },
] as const;

async function getImageDims(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

export function UploadForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [type, setType] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [category, setCategory] = useState<string>("");
  const [flags, setFlags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function onFile(f: File | null) {
    if (!f) return;
    setFile(f);
    setType(f.type.startsWith("video") ? "VIDEO" : "PHOTO");
    if (f.type.startsWith("image")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  function toggleFlag(v: string) {
    setFlags((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      toast.error("Pilih file dulu");
      return;
    }
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "");
    const description = String(form.get("description") ?? "");
    const priceStandard = Number(form.get("priceStandard") ?? 0);
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    startTransition(async () => {
      try {
        // 1. Minta presigned URL.
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            type,
          }),
        });
        if (!presignRes.ok) throw new Error("Gagal menyiapkan upload");
        const { configured, key, uploadUrl } = await presignRes.json();

        // 2. Upload file ke storage (jika dikonfigurasi).
        if (configured && uploadUrl) {
          const put = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!put.ok) throw new Error("Gagal mengunggah file");
        }

        // 3. Dimensi (untuk foto).
        const dims = type === "PHOTO" ? await getImageDims(file) : { width: 0, height: 0 };

        // 4. Simpan metadata.
        const res = await createAssetAction({
          type,
          title,
          description,
          categorySlug: category,
          tags,
          priceStandard,
          originalFileKey: key,
          width: dims.width || undefined,
          height: dims.height || undefined,
          sensitiveFlags: flags as ("SARA" | "POLITIK" | "DEWASA")[],
        });

        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        toast.success("Karya terkirim! Menunggu moderasi admin.");
        router.push("/contributor");
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      {/* Dropzone */}
      <div className="space-y-2">
        <Label>File karya</Label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/30 text-center transition-colors hover:border-primary"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" className="h-full w-full rounded-xl object-contain" />
          ) : file ? (
            <p className="px-4 text-sm">{file.name}</p>
          ) : (
            <>
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Seret & lepas, atau klik untuk pilih file
              </p>
              <p className="text-xs text-muted-foreground">Foto (JPG/PNG) atau Video (MP4)</p>
            </>
          )}
          {file && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Judul</Label>
          <Input id="title" name="title" required minLength={4} placeholder="cth: Sunset di Pantai Kuta" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" name="description" rows={3} placeholder="Jelaskan karyamu..." />
        </div>
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tag / kata kunci (pisahkan dengan koma)</Label>
          <Input id="tags" name="tags" placeholder="pantai, sunset, bali, alam" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceStandard">Harga lisensi Standard (Rp)</Label>
          <Input
            id="priceStandard"
            name="priceStandard"
            type="number"
            min={1000}
            step={1000}
            defaultValue={50000}
            required
          />
          <p className="text-xs text-muted-foreground">
            Harga Extended dihitung otomatis (3× Standard).
          </p>
        </div>
        <div className="space-y-2">
          <Label>Flag konten sensitif (opsional)</Label>
          <div className="flex gap-3">
            {SENSITIVE.map((s) => (
              <label key={s.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={flags.includes(s.value)}
                  onChange={() => toggleFlag(s.value)}
                />
                {s.label}
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...
            </>
          ) : (
            "Kirim untuk Moderasi"
          )}
        </Button>
      </div>
    </form>
  );
}
