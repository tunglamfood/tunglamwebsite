import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getCatalog } from "@/lib/portal/data";
import { CartView, type CartItemInfo } from "@/components/portal/cart-view";
import { PageTitle, myDate } from "@/components/portal/bits";

export const metadata = { title: "Cart" };

export default async function PortalCart() {
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const catalog = await getCatalog(ctx.customer.code, lang);

  // Everything the cart may contain, with today's price for this dealer.
  const items: Record<string, CartItemInfo> = {};
  for (const p of catalog) {
    for (const v of p.variants) {
      items[v.itemCode] = { name: p.name, label: v.label, uom: v.uom, price: v.price, promo: v.promo, image: v.image ?? p.image };
    }
  }

  return (
    <>
      <PageTitle title={d.cart.title} />
      <CartView
        scope={`${ctx.account.id}:${ctx.customer.code}`}
        items={items}
        currency={ctx.customer.currency}
        paymentTerms={ctx.customer.paymentTerms}
        onHold={ctx.customer.onHold}
        labels={d.cart}
        priceTbc={d.products.priceTbc}
        placedLabel={d.orders.placedThanks}
        promoLabel={d.products.promo}
        minDate={myDate(0)}
        maxDate={myDate(60)}
        defaultDate={myDate(1)}
      />
    </>
  );
}
