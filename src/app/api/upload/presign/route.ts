import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getCurrentUser } from "@/server/auth-helpers";
import { getUploadUrl, isStorageConfigured } from "@/server/adapters/storage/s3";
import { presignSchema } from "@/lib/validations/asset";
import { slugify } from "@/lib/slug";

// Memberi presigned URL untuk upload langsung ke object storage.
// Hanya kontributor/admin. Jika storage belum dikonfigurasi -> mode demo.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "CONTRIBUTOR" && user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = presignSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const { filename, contentType, type } = parsed.data;
  const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
  const key = `uploads/${user.id}/${type.toLowerCase()}/${randomUUID()}-${slugify(
    filename.replace(/\.[^/.]+$/, ""),
  )}.${ext}`;

  if (!isStorageConfigured()) {
    // Mode demo: tidak ada storage. Client tetap dapat key placeholder.
    return NextResponse.json({ configured: false, key, uploadUrl: null });
  }

  const uploadUrl = await getUploadUrl(key, contentType);
  return NextResponse.json({ configured: true, key, uploadUrl });
}
