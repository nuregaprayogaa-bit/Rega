import { Wallet, Clock, ArrowDownToLine, ArrowUpRight } from "lucide-react";

import { requireRole } from "@/server/auth-helpers";
import {
  getWallet,
  listEarnings,
  listPayouts,
  getPayoutAccount,
} from "@/server/services/wallet-service";
import { getMinPayoutIDR } from "@/server/services/config";
import { Role } from "@prisma/client";
import { formatIDR } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PayoutForm } from "@/components/sell/payout-form";
import { PayoutAccountForm } from "@/components/sell/payout-account-form";

export const dynamic = "force-dynamic";

const PAYOUT_STATUS: Record<string, string> = {
  PENDING: "Diproses",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  PAID: "Dibayar",
};

export default async function WalletPage() {
  const user = await requireRole([Role.FREELANCER, Role.ADMIN]);
  const [wallet, earnings, payouts, minPayout, account] = await Promise.all([
    getWallet(user.id),
    listEarnings(user.id),
    listPayouts(user.id),
    getMinPayoutIDR(),
    getPayoutAccount(user.id),
  ]);
  const accountLabel = account
    ? `${account.provider} ${account.accountNo} (${account.accountName})`
    : undefined;

  return (
    <div>
      <h1 className="text-2xl font-bold">Dompet</h1>
      <p className="text-sm text-muted-foreground">Kelola penghasilan & penarikan dana</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Wallet className="h-5 w-5" />
            <span className="text-sm font-medium">Saldo tersedia</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{formatIDR(wallet.availableIDR)}</p>
          <p className="text-xs text-muted-foreground">Siap ditarik</p>
        </div>
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-sm font-medium">Saldo tertahan</span>
          </div>
          <p className="mt-2 text-3xl font-bold">{formatIDR(wallet.pendingIDR)}</p>
          <p className="text-xs text-muted-foreground">Dari order yang sedang berjalan (escrow)</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Riwayat */}
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <ArrowDownToLine className="h-4 w-4" /> Riwayat penghasilan
            </h2>
            {earnings.length === 0 ? (
              <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Belum ada penghasilan.
              </p>
            ) : (
              <div className="divide-y rounded-xl border">
                {earnings.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {e.order?.gig.title ?? "Penghasilan"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.order?.code} · {formatDate(e.createdAt)}
                      </p>
                    </div>
                    <span className={e.direction === "CREDIT" ? "font-semibold text-success" : "font-semibold text-destructive"}>
                      {e.direction === "CREDIT" ? "+" : "−"}{formatIDR(e.amountIDR)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {payouts.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-semibold">
                <ArrowUpRight className="h-4 w-4" /> Riwayat penarikan
              </h2>
              <div className="divide-y rounded-xl border">
                {payouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <p className="font-medium">{formatIDR(p.amountIDR)}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.bankName} · {formatDate(p.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {PAYOUT_STATUS[p.status] ?? p.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Rekening penarikan + form tarik dana */}
        <div className="space-y-6">
          <PayoutAccountForm initial={account ? { type: account.type, provider: account.provider, accountName: account.accountName, accountNo: account.accountNo } : null} />
          <PayoutForm
            available={wallet.availableIDR}
            minPayout={minPayout}
            hasAccount={!!account}
            accountLabel={accountLabel}
          />
        </div>
      </div>
    </div>
  );
}
