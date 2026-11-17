import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrderUpdates, getOrders } from "@/lib/portal/data";
import { EmptyCard, OrderList, PageTitle, pbtn } from "@/components/portal/bits";

export const metadata = { title: "Orders" };

export default async function PortalOrders({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const [ctx, d, lang, { all }] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang(), searchParams]);
  // A chain's head office (or a rep) can see every branch's orders in one list.
  const many = ctx.customers.length > 1;
  const everyBranch = many && all === "1";
  const codes = everyBranch ? ctx.customers.map((c) => c.code) : [ctx.customer.code];
  const [orders, updates] = await Promise.all([getOrders(codes, everyBranch ? 150 : 50), getOrderUpdates(codes)]);
  const scope = `${ctx.account.id}:${ctx.customer.code}`;
  const updateAt = Object.fromEntries(updates.map((u) => [u.orderNo, u.at]));
  const nameOf = new Map(ctx.customers.map((c) => [c.code, c.shortName || c.name]));

  return (
    <>
      <PageTitle
        title={d.orders.title}
        right={
          <Link href="/portal/products" className={pbtn("primary")}>
            <Plus className="size-4" aria-hidden /> {d.home.start}
          </Link>
        }
      />
      {many && (
        <div className="mb-4 inline-flex rounded-xl bg-white/70 p-1 ring-1 ring-line">
          <Link href="/portal/orders" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${everyBranch ? "text-muted hover:text-ink" : "bg-brand text-white"}`}>{d.orders.thisBranch}</Link>
          <Link href="/portal/orders?all=1" className={`rounded-lg px-3 py-1.5 text-sm font-medium ${everyBranch ? "bg-brand text-white" : "text-muted hover:text-ink"}`}>{d.orders.allBranches}</Link>
        </div>
      )}
      {orders.length === 0 ? (
        <EmptyCard>{d.orders.empty}</EmptyCard>
      ) : (
        <OrderList
          orders={orders.map((o) => ({ ...o, branch: everyBranch ? nameOf.get(o.customerCode) ?? o.customerCode : undefined }))}
          d={d}
          lang={lang}
          scope={scope}
          updates={updateAt}
        />
      )}
    </>
  );
}
