import "server-only";
import sharp from "sharp";

// Pemrosesan gambar dengan Sharp: metadata, thumbnail/preview, dan watermark.

export type ImageMeta = { width: number; height: number };

export async function readImageMeta(buf: Buffer): Promise<ImageMeta> {
  const m = await sharp(buf).metadata();
  return { width: m.width ?? 0, height: m.height ?? 0 };
}

/** Preview resolusi rendah (sisi terpanjang maks `max` px), JPEG. */
export async function makePreview(buf: Buffer, max = 1280): Promise<Buffer> {
  return sharp(buf)
    .rotate()
    .resize(max, max, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Versi ber-watermark untuk tampilan publik: di-resize, lalu ditimpa
 * teks watermark berpola (tiled) agar tidak bisa dipakai tanpa beli.
 */
export async function makeWatermarked(
  buf: Buffer,
  text = "NUSAGRAF",
  max = 1280,
): Promise<Buffer> {
  const base = sharp(buf)
    .rotate()
    .resize(max, max, { fit: "inside", withoutEnlargement: true });

  const meta = await base.clone().metadata();
  const w = meta.width ?? max;
  const h = meta.height ?? max;

  // SVG watermark berpola diagonal.
  const tile = 220;
  const cols = Math.ceil(w / tile) + 1;
  const rows = Math.ceil(h / tile) + 1;
  let texts = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile;
      const y = r * tile;
      texts += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="22" fill="rgba(255,255,255,0.45)" transform="rotate(-30 ${x} ${y})">${text}</text>`;
    }
  }
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${texts}</svg>`;

  return base
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 78 })
    .toBuffer();
}
