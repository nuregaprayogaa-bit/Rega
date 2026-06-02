// Utilitas uang untuk IDR. Semua nominal adalah INTEGER rupiah penuh.

/**
 * Format rupiah tanpa desimal, mis. 50000 -> "Rp 50.000".
 */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  // Intl menghasilkan "Rp50.000"; tambahkan spasi agar "Rp 50.000".
  return formatted.replace(/^Rp\s?/, "Rp ");
}

/**
 * Hitung PPN dari subtotal. Membulatkan ke rupiah terdekat.
 */
export function calcPPN(subtotal: number, ppnPercent: number): number {
  return Math.round((subtotal * ppnPercent) / 100);
}

/**
 * Pecah harga jual (gross, sebelum PPN) menjadi fee platform & earning kontributor.
 */
export function splitEarning(
  gross: number,
  platformFeePercent: number,
): { platformFee: number; netEarning: number } {
  const platformFee = Math.round((gross * platformFeePercent) / 100);
  const netEarning = gross - platformFee;
  return { platformFee, netEarning };
}
