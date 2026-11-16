import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrders } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { PageTitle, StatusPill, formatDate } from "@/components/portal/bits";

export const metadata = { title: "Orders" };

export default async function PortalOrders() {
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const orders = await getOrders([ctx.customer.code]);

  return (
    <>
      <PageTitle title={d.orders.title} />
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">{d.orders.empty}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {orders.map((o) => (
            <li key={o.orderNo}>
              <Link href={`/portal/orders/${encodeURIComponent(o.orderNo)}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-cream">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{o.orderNo}</span>
                    <StatusPill status={o.status} label={d.orders.status[o.status]} />
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {pfmt(d.orders.placedOn, { date: formatDate(o.orderDate, lang) })}
                    {o.deliverOn && ` · ${pfmt(d.orders.deliverOn, { date: formatDate(o.deliverOn, lang) })}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink">{money(o.total, o.currency)}{o.hasTbc ? " +" : ""}</p>
                  <p className="text-xs text-muted">{pfmt(d.orders.items, { n: o.lines.length })}</p>
                </div>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
