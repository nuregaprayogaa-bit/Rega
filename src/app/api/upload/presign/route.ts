import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { getCurrentUser } from "@/server/auth-helpers";
import {
  getUploadUrl,
  getPublicUrl,
  isStorageConfigured,
} from "@/server/adapters/storage/s3";
import { slugify } from "@/lib/slug";

const presignSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(100),
});

// Memberi presigned URL untuk upload gambar (thumbnail/galeri/avatar) ke object storage.
// Hanya pengguna login. Jika storage belum dikonfigurasi -> mode demo (pakai URL gambar manual).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = presignSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { filename, contentType } = parsed.data;
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const key = `uploads/${user.id}/${randomUUID()}-${slugify(
    filename.replace(/\.[^/.]+$/, ""),
  )}.${ext}`;

  if (!isStorageConfigured()) {
    return NextResponse.json({ configured: false, key, uploadUrl: null, publicUrl: null });
  }

  const uploadUrl = await getUploadUrl(key, contentType);
  return NextResponse.json({
    configured: true,
    key,
    uploadUrl,
    publicUrl: getPublicUrl(key),
  });
}
