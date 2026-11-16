import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrder } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { OrderActions } from "@/components/portal/order-actions";
import { StatusPill, formatDate } from "@/components/portal/bits";

export const metadata = { title: "Order" };

export default async function PortalOrder({ params, searchParams }: { params: Promise<{ no: string }>; searchParams: Promise<{ placed?: string }> }) {
  const [{ no }, { placed }] = await Promise.all([params, searchParams]);
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const order = await getOrder(decodeURIComponent(no), ctx.customers.map((c) => c.code));
  if (!order) notFound();
  const scope = `${ctx.account.id}:${order.customerCode}`;
  const eventLabel = (k: string) => (d.orders.events as Record<string, string>)[k] ?? k;

  return (
    <div className="space-y-5">
      <Link href="/portal/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> {d.orders.back}
      </Link>

      {placed && order.status === "submitted" && (
        <div className="flex gap-3 rounded-2xl bg-leaf-soft p-4 text-leaf">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">{pfmt(d.orders.placedThanks, { no: order.orderNo })}</p>
            <p className="text-sm text-ink-soft">{d.orders.placedNext}</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{order.orderNo}</h1>
            <p className="mt-1 text-sm text-muted">
              {pfmt(d.orders.placedOn, { date: formatDate(order.orderDate, lang) })}
              {order.deliverOn && ` · ${pfmt(d.orders.deliverOn, { date: formatDate(order.deliverOn, lang) })}`}
            </p>
          </div>
          <StatusPill status={order.status} label={d.orders.status[order.status]} />
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {order.theirRef && (<div><dt className="text-muted">{d.orders.poRef}</dt><dd className="font-medium text-ink">{order.theirRef}</dd></div>)}
          {order.placedBy && (<div><dt className="text-muted">{d.orders.placedBy}</dt><dd className="font-medium text-ink">{order.placedBy}</dd></div>)}
          {order.note && (<div className="sm:col-span-3"><dt className="text-muted">{d.orders.note}</dt><dd className="whitespace-pre-wrap text-ink">{order.note}</dd></div>)}
        </dl>
        <div className="mt-5">
          <OrderActions
            scope={scope}
            orderNo={order.orderNo}
            canCancel={order.status === "submitted"}
            lines={order.lines.map((l) => ({ itemCode: l.itemCode, qty: l.qty }))}
            labels={{ reorder: d.orders.reorder, cancel: d.orders.cancel, cancelConfirm: d.orders.cancelConfirm }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <h2 className="border-b border-line px-4 py-3 font-semibold text-ink sm:px-6">{d.orders.lines}</h2>
        <ul className="divide-y divide-line">
          {order.lines.map((l) => (
            <li key={l.lineNo} className="flex items-start gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{l.description}</p>
                <p className="text-xs text-muted">{l.itemCode}</p>
              </div>
              <div className="text-right text-sm">
                <p className="text-ink-soft">{l.qty} {l.uom.toLowerCase()} × {l.price > 0 ? money(l.price, order.currency) : d.orders.tbc}</p>
                <p className="font-semibold text-ink">{l.price > 0 ? money(l.qty * l.price, order.currency) : "—"}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t border-line bg-cream px-4 py-3 sm:px-6">
          <span className="font-semibold text-ink">{d.orders.total}</span>
          <span className="font-display text-xl font-semibold text-ink">{money(order.total, order.currency)}{order.hasTbc ? " +" : ""}</span>
        </div>
      </section>

      {order.events.length > 0 && (
        <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
          <h2 className="mb-3 font-semibold text-ink">{d.orders.history}</h2>
          <ol className="space-y-3 border-l-2 border-line pl-4">
            {order.events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full bg-brand" />
                <p className="text-sm font-medium text-ink">{eventLabel(e.kind)}</p>
                <p className="text-xs text-muted">{formatDate(e.at, lang, true)} · {e.actor}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
