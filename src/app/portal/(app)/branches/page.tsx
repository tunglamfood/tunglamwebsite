import { redirect } from "next/navigation";
import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getCatalog, getLastOrderLines } from "@/lib/portal/data";
import { PageTitle, myDate } from "@/components/portal/bits";
import { BranchOrder } from "@/components/portal/branch-order";

export const metadata = { title: "Order for many branches" };
export const maxDuration = 60;

export default async function PortalBranches() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  if (ctx.customers.length < 2) redirect("/portal/products");
  // Branches of one chain share its catalogue; the database re-checks each branch's items and prices.
  const first = ctx.customer ?? ctx.customers[0];
  const [catalog, last] = await Promise.all([getCatalog(first.code, lang), getLastOrderLines(ctx.customers.map((c) => c.code))]);
  const items = catalog.flatMap((p) =>
    p.variants.map((v) => ({ itemCode: v.itemCode, name: p.name, label: v.label, uom: v.uom, image: v.image ?? p.image })),
  );
  return (
    <>
      <PageTitle title={d.branches.title} sub={d.branches.intro} />
      <BranchOrder
        labels={d.branches}
        branches={ctx.customers.map((c) => ({ code: c.code, name: c.shortName || c.name }))}
        items={items}
        last={last}
        defaultDate={myDate(1)}
        minDate={myDate(0)}
        maxDate={myDate(60)}
      />
    </>
  );
}
