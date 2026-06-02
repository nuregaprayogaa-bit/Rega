import Script from "next/script";

import { requireUser } from "@/server/auth-helpers";
import { getPpnPercent } from "@/server/services/config";
import { isPaymentConfigured } from "@/server/adapters/payment";
import { CheckoutClient } from "@/components/checkout/checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  await requireUser("/checkout");
  const ppnPercent = await getPpnPercent();
  const snapEnabled = isPaymentConfigured();
  const isProduction = process.env.MIDTRANS_IS_SANDBOX === "false";
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
  const snapSrc = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      {snapEnabled && (
        <Script src={snapSrc} data-client-key={clientKey} strategy="afterInteractive" />
      )}
      <CheckoutClient ppnPercent={ppnPercent} snapEnabled={snapEnabled} />
    </div>
  );
}
