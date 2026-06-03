import "server-only";
import { LedgerDirection, type Prisma } from "@prisma/client";

// ============================================================
// BUKU BESAR DOUBLE-ENTRY (immutable)
// ------------------------------------------------------------
// Setiap event keuangan menghasilkan beberapa entri yang SEIMBANG
// (total DEBIT == total CREDIT). Entri tidak pernah diubah/dihapus;
// koreksi dilakukan dengan entri baru. Setiap entri punya `ref` unik
// sebagai pengaman idempotensi (anti dobel-proses webhook).
//
// Akun:
//   CLIENT_CASH      uang masuk dari client (eksternal)
//   ESCROW           dana ditahan platform sampai order selesai
//   PLATFORM_REVENUE pendapatan platform (biaya layanan + komisi)
//   CLIENT_REFUND    pengembalian dana ke client (eksternal)
//   PAYOUT_CASH      kas keluar untuk penarikan freelancer (eksternal)
//   wallet:<userId>  saldo dompet freelancer
// ============================================================

type Tx = Prisma.TransactionClient;

export function walletAccount(userId: string): string {
  return `wallet:${userId}`;
}

/**
 * CAPTURE — client membayar total order; dana masuk ke escrow.
 * DEBIT  CLIENT_CASH (total)
 * CREDIT ESCROW      (total)
 */
export async function ledgerCapture(
  tx: Tx,
  order: { id: string; totalIDR: number },
): Promise<void> {
  await tx.ledgerEntry.createMany({
    data: [
      {
        account: "CLIENT_CASH",
        direction: LedgerDirection.DEBIT,
        amountIDR: order.totalIDR,
        orderId: order.id,
        type: "CAPTURE",
        ref: `${order.id}:CAPTURE:cash`,
      },
      {
        account: "ESCROW",
        direction: LedgerDirection.CREDIT,
        amountIDR: order.totalIDR,
        orderId: order.id,
        type: "CAPTURE",
        ref: `${order.id}:CAPTURE:escrow`,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * RELEASE — order selesai; escrow dibagi ke freelancer (net) & platform.
 * DEBIT  ESCROW              (total)
 * CREDIT wallet:<freelancer> (net)
 * CREDIT PLATFORM_REVENUE    (total - net)
 */
export async function ledgerRelease(
  tx: Tx,
  order: {
    id: string;
    totalIDR: number;
    freelancerNetIDR: number;
    freelancerId: string;
  },
): Promise<void> {
  const platformShare = order.totalIDR - order.freelancerNetIDR;
  await tx.ledgerEntry.createMany({
    data: [
      {
        account: "ESCROW",
        direction: LedgerDirection.DEBIT,
        amountIDR: order.totalIDR,
        orderId: order.id,
        type: "RELEASE",
        ref: `${order.id}:RELEASE:escrow`,
      },
      {
        account: walletAccount(order.freelancerId),
        direction: LedgerDirection.CREDIT,
        amountIDR: order.freelancerNetIDR,
        orderId: order.id,
        type: "RELEASE",
        ref: `${order.id}:RELEASE:wallet`,
      },
      {
        account: "PLATFORM_REVENUE",
        direction: LedgerDirection.CREDIT,
        amountIDR: platformShare,
        orderId: order.id,
        type: "RELEASE",
        ref: `${order.id}:RELEASE:platform`,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * REFUND — order dibatalkan sebelum selesai; escrow dikembalikan ke client.
 * DEBIT  ESCROW        (total)
 * CREDIT CLIENT_REFUND (total)
 */
export async function ledgerRefund(
  tx: Tx,
  order: { id: string; totalIDR: number },
): Promise<void> {
  await tx.ledgerEntry.createMany({
    data: [
      {
        account: "ESCROW",
        direction: LedgerDirection.DEBIT,
        amountIDR: order.totalIDR,
        orderId: order.id,
        type: "REFUND",
        ref: `${order.id}:REFUND:escrow`,
      },
      {
        account: "CLIENT_REFUND",
        direction: LedgerDirection.CREDIT,
        amountIDR: order.totalIDR,
        orderId: order.id,
        type: "REFUND",
        ref: `${order.id}:REFUND:client`,
      },
    ],
    skipDuplicates: true,
  });
}

/**
 * PAYOUT — penarikan dana freelancer; saldo dompet keluar.
 * DEBIT  wallet:<user> (amount)
 * CREDIT PAYOUT_CASH   (amount)
 */
export async function ledgerPayout(
  tx: Tx,
  payout: { id: string; userId: string; amountIDR: number },
): Promise<void> {
  await tx.ledgerEntry.createMany({
    data: [
      {
        account: walletAccount(payout.userId),
        direction: LedgerDirection.DEBIT,
        amountIDR: payout.amountIDR,
        type: "PAYOUT",
        ref: `payout:${payout.id}:wallet`,
      },
      {
        account: "PAYOUT_CASH",
        direction: LedgerDirection.CREDIT,
        amountIDR: payout.amountIDR,
        type: "PAYOUT",
        ref: `payout:${payout.id}:cash`,
      },
    ],
    skipDuplicates: true,
  });
}
