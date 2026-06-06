// Abstraksi disbursement (transfer dana ke rekening freelancer).
// Mudah diganti provider (Xendit -> Midtrans Iris, dll).

export type DisbursementParams = {
  externalId: string; // unik per payout (idempotensi)
  amount: number; // rupiah, integer
  bankCode: string; // kode bank sesuai provider (mis. "BCA", "MANDIRI")
  accountHolderName: string;
  accountNumber: string;
  description?: string;
};

export type DisbursementResult = {
  ok: boolean;
  reference?: string; // id transaksi dari provider
  status?: string;
  error?: string;
};

export interface DisbursementProvider {
  readonly name: string;
  disburse(params: DisbursementParams): Promise<DisbursementResult>;
}
