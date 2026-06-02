import { getPublicUrl } from "@/server/adapters/storage/s3";

// Menentukan URL gambar yang AMAN ditampilkan publik (preview/watermark).
// Prioritas: URL publik dari storage (jika dikonfigurasi). Jika belum,
// pakai placeholder deterministik agar katalog tetap tampil saat demo.

type DisplayableAsset = {
  id: string;
  watermarkedFileKey: string | null;
  previewFileKey: string | null;
  width?: number | null;
  height?: number | null;
};

export function assetPreviewUrl(asset: DisplayableAsset): string {
  const key = asset.watermarkedFileKey ?? asset.previewFileKey;
  if (key) {
    const url = getPublicUrl(key);
    if (url) return url;
  }
  // Placeholder deterministik (saat storage belum dikonfigurasi).
  const w = asset.width && asset.width > 0 ? Math.min(asset.width, 1200) : 800;
  const h = asset.height && asset.height > 0 ? Math.min(asset.height, 1200) : 600;
  return `https://picsum.photos/seed/${asset.id}/${w}/${h}`;
}
