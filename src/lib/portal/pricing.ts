/**
 * Shown to the dealer only: the ERP database prices every order line itself when the
 * order is placed (portal_place_order → sales_promo_for). This mirrors that rule so the
 * cart can show the promotion before ordering.
 */
export type Promo = { price: number; minQty: number; title: string; endsOn: string | null };

export function unitPrice(v: { price: number | null; promo: Promo | null }, qty: number): { price: number | null; promo: boolean } {
  if (v.promo && qty >= v.promo.minQty && (v.price == null || v.promo.price < v.price)) return { price: v.promo.price, promo: true };
  return { price: v.price, promo: false };
}
