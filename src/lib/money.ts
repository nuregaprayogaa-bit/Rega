// Utilitas uang untuk IDR. Semua nominal adalah INTEGER rupiah penuh.
// JANGAN gunakan float untuk uang.

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

/** Versi ringkas, mis. 1500000 -> "Rp 1,5 jt". Untuk badge harga. */
export function formatIDRShort(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp ${jt % 1 === 0 ? jt : jt.toFixed(1).replace(".", ",")} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${Math.round(amount / 1000)} rb`;
  }
  return formatIDR(amount);
}

/**
 * Hitung biaya layanan client (buyer fee) dari harga paket.
 * Membulatkan ke rupiah terdekat.
 */
export function calcServiceFee(packagePrice: number, feePercent: number): number {
  return Math.round((packagePrice * feePercent) / 100);
}

/**
 * Hitung komisi platform (seller commission) dari harga paket.
 */
export function calcCommission(packagePrice: number, feePercent: number): number {
  return Math.round((packagePrice * feePercent) / 100);
}

/**
 * Rincian keuangan satu order, dihitung dari harga paket.
 * Sumber kebenaran tunggal supaya checkout, ledger, dan tampilan konsisten.
 */
export function computeOrderAmounts(params: {
  packagePrice: number;
  buyerFeePercent: number;
  commissionPercent: number;
}): {
  packagePriceIDR: number;
  serviceFeeIDR: number;
  totalIDR: number;
  commissionIDR: number;
  freelancerNetIDR: number;
} {
  const packagePriceIDR = Math.round(params.packagePrice);
  const serviceFeeIDR = calcServiceFee(packagePriceIDR, params.buyerFeePercent);
  const commissionIDR = calcCommission(packagePriceIDR, params.commissionPercent);
  return {
    packagePriceIDR,
    serviceFeeIDR,
    totalIDR: packagePriceIDR + serviceFeeIDR,
    commissionIDR,
    freelancerNetIDR: packagePriceIDR - commissionIDR,
  };
}
