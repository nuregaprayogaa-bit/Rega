import "server-only";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Adapter penyimpanan S3-compatible (Cloudflare R2 / AWS S3 / MinIO).
// File key asli TIDAK PERNAH diekspos ke client; client hanya menerima
// presigned URL berbatas waktu yang dibuat di server.

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const endpoint = process.env.S3_ENDPOINT;
  _client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: endpoint || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });
  return _client;
}

function bucket(): string {
  return process.env.S3_BUCKET || "rega-media";
}

/** Apakah storage sudah dikonfigurasi (kredensial tersedia)? */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_BUCKET,
  );
}

/** Presigned URL untuk UPLOAD (PUT) dari browser. */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

/** Presigned URL untuk DOWNLOAD (GET) berbatas waktu. */
export async function getDownloadUrl(
  key: string,
  expiresIn = 300,
  downloadFilename?: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket(),
    Key: key,
    ResponseContentDisposition: downloadFilename
      ? `attachment; filename="${downloadFilename}"`
      : undefined,
  });
  return getSignedUrl(getClient(), command, { expiresIn });
}

/** Upload buffer langsung dari server (mis. hasil watermark/thumbnail). */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Ambil objek sebagai Buffer (untuk diproses di server). */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
  );
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
  );
}

/** URL publik (jika bucket/CDN publik dikonfigurasi), untuk preview/watermark. */
export function getPublicUrl(key: string): string | null {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${key}`;
}
