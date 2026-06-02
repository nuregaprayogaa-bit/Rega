import { requireRole } from "@/server/auth-helpers";
import { db } from "@/server/db";
import { isStorageConfigured } from "@/server/adapters/storage/s3";
import { UploadForm } from "@/components/contributor/upload-form";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  await requireRole(["CONTRIBUTOR", "ADMIN"], "/contributor/upload");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  const storageReady = isStorageConfigured();

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-1 text-2xl font-bold">Unggah Karya</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Unggah foto/video, isi metadata, lalu kirim untuk ditinjau admin.
      </p>

      {!storageReady && (
        <div className="mb-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <strong>Mode demo:</strong> object storage (R2/S3) belum dikonfigurasi,
          jadi file tidak benar-benar diunggah. Metadata tetap tersimpan & bisa
          dimoderasi. Atur kredensial S3 di environment untuk upload nyata.
        </div>
      )}

      <UploadForm categories={categories} />
    </div>
  );
}
