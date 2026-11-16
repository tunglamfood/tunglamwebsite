import Link from "next/link";
import { ArrowRight, ChevronRight, Package } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang, customerLabel } from "@/lib/portal/context";
import { getOrders } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { ReorderButton } from "@/components/portal/order-actions";
import { StatusPill, formatDate } from "@/components/portal/bits";
import { redirect } from "next/navigation";

export const metadata = { title: "Home" };

export default async function PortalHome() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  if (!ctx.customer) redirect("/portal/dealers");
  const orders = await getOrders([ctx.customer.code], 5);
  const last = orders.find((o) => o.status !== "cancelled");
  const scope = `${ctx.account.id}:${ctx.customer.code}`;
  const name = ctx.account.name || ctx.customer.shortName || ctx.customer.name;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-ink p-5 text-white sm:p-7">
        <h1 className="font-display text-2xl font-semibold sm:text-3xl">{pfmt(d.home.hello, { name })}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/60">{d.home.orderingFor}</span>
          <span className="font-semibold">{customerLabel(ctx.customer)}</span>
          <span className="text-white/50">· {ctx.customer.code}</span>
          {ctx.customers.length > 1 && (
            <Link href="/portal/dealers" className="ml-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20">{d.home.switch}</Link>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/portal/products" className="flex items-center gap-4 rounded-2xl bg-brand p-4 text-white transition hover:bg-brand-600">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15"><Package className="size-5" /></span>
          <span className="flex-1">
            <span className="block font-semibold">{d.home.start}</span>
            <span className="block text-sm text-white/80">{d.home.startText}</span>
          </span>
          <ArrowRight className="size-5" />
        </Link>
        {last && (
          <ReorderButton
            scope={scope}
            lines={last.lines.map((l) => ({ itemCode: l.itemCode, qty: l.qty }))}
            title={d.home.reorder}
            text={pfmt(d.home.reorderText, { no: last.orderNo })}
          />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">{d.home.recent}</h2>
          {orders.length > 0 && <Link href="/portal/orders" className="text-sm font-medium text-brand">{d.home.viewAll}</Link>}
        </div>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-center text-sm text-muted">{d.home.none}</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {orders.map((o) => (
              <li key={o.orderNo}>
                <Link href={`/portal/orders/${encodeURIComponent(o.orderNo)}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{o.orderNo}</p>
                    <p className="text-sm text-muted">
                      {formatDate(o.orderDate, lang)} · {pfmt(d.orders.items, { n: o.lines.length })} · {money(o.total, o.currency)}
                    </p>
                  </div>
                  <StatusPill status={o.status} label={d.orders.status[o.status]} />
                  <ChevronRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
