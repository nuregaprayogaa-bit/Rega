import "server-only";
import type {
  DisbursementParams,
  DisbursementProvider,
  DisbursementResult,
} from "@/server/adapters/disbursement/types";

// Provider disbursement Xendit (https://docs.xendit.co/disbursement).
// Auth: Basic dengan XENDIT_API_KEY sebagai username (password kosong).
export class XenditDisbursement implements DisbursementProvider {
  readonly name = "xendit";

  async disburse(params: DisbursementParams): Promise<DisbursementResult> {
    const key = process.env.XENDIT_API_KEY;
    if (!key) return { ok: false, error: "XENDIT_API_KEY belum diset" };

    const auth = Buffer.from(`${key}:`).toString("base64");
    try {
      const res = await fetch("https://api.xendit.co/disbursements", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          // Idempotensi: Xendit tidak akan mengirim dobel untuk external_id yang sama.
          "X-IDEMPOTENCY-KEY": params.externalId,
        },
        body: JSON.stringify({
          external_id: params.externalId,
          amount: params.amount,
          bank_code: params.bankCode,
          account_holder_name: params.accountHolderName,
          account_number: params.accountNumber,
          description: params.description ?? "Worq payout",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        status?: string;
        message?: string;
      };
      if (!res.ok) {
        return { ok: false, error: data.message ?? `Xendit error ${res.status}` };
      }
      return { ok: true, reference: data.id, status: data.status };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Gagal menghubungi Xendit" };
    }
  }
}
