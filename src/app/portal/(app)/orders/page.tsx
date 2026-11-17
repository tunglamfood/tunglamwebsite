import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrderUpdates, getOrders } from "@/lib/portal/data";
import { EmptyCard, OrderList, PageTitle, pbtn } from "@/components/portal/bits";

export const metadata = { title: "Orders" };

export default async function PortalOrders() {
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const [orders, updates] = await Promise.all([getOrders([ctx.customer.code]), getOrderUpdates([ctx.customer.code])]);
  const scope = `${ctx.account.id}:${ctx.customer.code}`;
  const updateAt = Object.fromEntries(updates.map((u) => [u.orderNo, u.at]));

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
      {orders.length === 0 ? <EmptyCard>{d.orders.empty}</EmptyCard> : <OrderList orders={orders} d={d} lang={lang} scope={scope} updates={updateAt} />}
    </>
  );
}
