import { getPpnPercent } from "@/server/services/config";
import { CartView } from "@/components/cart/cart-view";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const ppnPercent = await getPpnPercent();
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-2xl font-bold">Keranjang</h1>
      <CartView ppnPercent={ppnPercent} />
    </div>
  );
}
