import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getCatalog, getUsualItems } from "@/lib/portal/data";
import { Catalog } from "@/components/portal/catalog";
import { PageTitle } from "@/components/portal/bits";

export const metadata = { title: "Products" };

export default async function PortalProducts({ searchParams }: { searchParams: Promise<{ usual?: string; q?: string; slug?: string }> }) {
  const [ctx, d, lang, { usual: startUsual, q, slug }] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang(), searchParams]);
  const [products, usual] = await Promise.all([getCatalog(ctx.customer.code, lang), getUsualItems(ctx.customer.code)]);
  // Arriving from a product page on tunglamfood.my: open on that product.
  const fromWebsite = slug ? products.find((p) => p.slug === slug)?.name : undefined;
  return (
    <>
      <PageTitle title={d.products.title} />
      <Catalog
        products={products}
        usual={usual}
        startUsual={startUsual === "1" && Object.keys(usual).length > 0}
        startQuery={(fromWebsite ?? q)?.slice(0, 80) ?? ""}
        scope={`${ctx.account.id}:${ctx.customer.code}`}
        currency={ctx.customer.currency}
        labels={d.products}
        cartLabel={d.nav.cart}
      />
    </>
  );
}
