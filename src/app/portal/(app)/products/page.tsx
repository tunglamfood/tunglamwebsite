import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getCatalog } from "@/lib/portal/data";
import { Catalog } from "@/components/portal/catalog";
import { PageTitle } from "@/components/portal/bits";

export const metadata = { title: "Products" };

export default async function PortalProducts() {
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const products = await getCatalog(ctx.customer.code, lang);
  return (
    <>
      <PageTitle title={d.products.title} />
      <Catalog products={products} scope={`${ctx.account.id}:${ctx.customer.code}`} currency={ctx.customer.currency} labels={d.products} />
    </>
  );
}
