import { requirePortal, getPortalDict } from "@/lib/portal/context";
import { PageTitle } from "@/components/portal/bits";
import { DealerList } from "@/components/portal/dealer-list";

export const metadata = { title: "Choose a dealer" };

export default async function PortalDealers() {
  const [ctx, d] = await Promise.all([requirePortal(), getPortalDict()]);
  return (
    <>
      <PageTitle title={d.dealers.title} sub={ctx.account.role === "rep" ? d.dealers.leadRep : d.dealers.leadGroup} />
      {ctx.customers.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-8 text-center text-muted">{d.dealers.none}</p>
      ) : (
        <DealerList customers={ctx.customers} current={ctx.customer?.code ?? null} searchLabel={d.dealers.search} />
      )}
    </>
  );
}
