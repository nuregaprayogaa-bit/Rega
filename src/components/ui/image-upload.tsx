"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Link2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Pemilih gambar: upload dari perangkat (jika object storage dikonfigurasi)
 * ATAU tempel URL gambar. Mengembalikan URL final lewat onChange.
 */
export function ImageUpload({
  value,
  onChange,
  className,
  aspect = "aspect-[16/9]",
}: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const data = await res.json();
      if (!data.configured || !data.uploadUrl || !data.publicUrl) {
        toast.info("Upload file belum aktif. Tempel URL gambar saja untuk sekarang.");
        setMode("url");
        return;
      }
      const put = await fetch(data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("upload gagal");
      onChange(data.publicUrl);
      toast.success("Gambar terunggah");
    } catch {
      toast.error("Gagal mengunggah. Coba tempel URL gambar.");
      setMode("url");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Preview */}
      {value ? (
        <div className={cn("relative overflow-hidden rounded-lg border bg-muted", aspect)}>
          <Image src={value} alt="" fill className="object-cover" sizes="400px" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
            aria-label="Hapus gambar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (mode === "upload" ? inputRef.current?.click() : undefined)}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground",
            aspect,
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span>{mode === "upload" ? "Klik untuk unggah gambar" : "Tempel URL gambar di bawah"}</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />

      {/* Toggle mode + input URL */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode(mode === "upload" ? "url" : "upload")}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {mode === "upload" ? <Link2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
          {mode === "upload" ? "atau tempel URL" : "atau unggah file"}
        </button>
      </div>
      {mode === "url" && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://contoh.com/gambar.jpg"
        />
      )}
    </div>
  );
}
