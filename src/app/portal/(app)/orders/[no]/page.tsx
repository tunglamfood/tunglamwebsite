import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CheckCircle2, FileDown, MessageSquareText, Truck } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrder } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { OrderActions } from "@/components/portal/order-actions";
import { StatusPill, formatDate, pbtn, pcard } from "@/components/portal/bits";
import { MarkSeen } from "@/components/portal/updates";

export const metadata = { title: "Order" };

export default async function PortalOrder({ params, searchParams }: { params: Promise<{ no: string }>; searchParams: Promise<{ placed?: string }> }) {
  const [{ no }, { placed }] = await Promise.all([params, searchParams]);
  const [ctx, d, lang] = await Promise.all([requireCustomer(), getPortalDict(), getPortalLang()]);
  const order = await getOrder(decodeURIComponent(no), ctx.customers.map((c) => c.code));
  if (!order) notFound();
  const scope = `${ctx.account.id}:${order.customerCode}`;
  const eventLabel = (k: string) => (d.orders.events as Record<string, string>)[k] ?? k;
  const lastOffice = [...order.events].reverse().find((e) => e.office)?.at ?? null;
  const latestMessage = [...order.events].reverse().find((e) => e.message);
  const details = [
    order.theirRef ? { k: d.orders.poRef, v: order.theirRef } : null,
    order.placedBy ? { k: d.orders.placedBy, v: order.placedBy } : null,
    order.note ? { k: d.orders.note, v: order.note } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="space-y-4 sm:space-y-5">
      <MarkSeen scope={scope} orderNo={order.orderNo} at={lastOffice} />
      <Link href="/portal/orders" className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
        <ArrowLeft className="size-4" /> {d.orders.back}
      </Link>

      {placed && (order.status === "submitted" || order.status === "on_hold") && (
        <div className="flex animate-fade-up gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-[var(--shadow-xs)]">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-emerald-900">{pfmt(d.orders.placedThanks, { no: order.orderNo })}</p>
            <p className="text-sm text-emerald-800/80">{order.status === "on_hold" ? d.orders.placedHold : d.orders.placedNext}</p>
          </div>
        </div>
      )}

      {latestMessage?.message && (
        <div className="flex gap-3 rounded-2xl border border-brand/20 bg-brand-50/70 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-[var(--shadow-xs)]">
            <MessageSquareText className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {d.orders.messageFrom} · <span className="font-normal text-muted">{formatDate(latestMessage.at, lang, true)}</span>
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">{latestMessage.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <section className={`${pcard} p-4 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink sm:text-3xl">{order.orderNo}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                {pfmt(d.orders.placedOn, { date: formatDate(order.orderDate, lang) })}
              </span>
              {order.deliverOn && (
                <span className="inline-flex items-center gap-1.5">
                  <Truck className="size-4 text-muted" aria-hidden />
                  {pfmt(d.orders.deliverOn, { date: formatDate(order.deliverOn, lang) })}
                </span>
              )}
            </div>
          </div>
          <StatusPill status={order.status} label={d.orders.status[order.status]} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          <OrderActions
            scope={scope}
            orderNo={order.orderNo}
            canCancel={order.status === "submitted" || order.status === "on_hold"}
            lines={order.lines.map((l) => ({ itemCode: l.itemCode, qty: l.qty }))}
            labels={{ reorder: d.orders.reorder, cancel: d.orders.cancel, cancelConfirm: d.orders.cancelConfirm, reordered: d.orders.reordered, cancelled: d.orders.cancelledToast }}
          />
          {order.status !== "cancelled" && (
            <a href={`/portal/orders/${encodeURIComponent(order.orderNo)}/pdf`} className={pbtn("secondary")}>
              <FileDown className="size-4" /> {d.orders.pdf}
            </a>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* Lines */}
        <section className={`${pcard} overflow-hidden`}>
          <h2 className="flex items-center gap-2 border-b border-line px-4 py-3 text-sm font-semibold text-ink sm:px-6">
            {d.orders.lines}
            <span className="rounded-full bg-sand px-2 text-xs leading-5 text-muted tabular-nums">{order.lines.length}</span>
          </h2>
          <ul className="divide-y divide-line">
            {order.lines.map((l) => (
              <li key={l.lineNo} className="flex items-start gap-3 px-4 py-3.5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug text-ink">{l.description}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-muted">{l.itemCode}</p>
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="tabular-nums text-ink-soft">
                    {l.qty} {l.uom.toLowerCase()} × {l.price > 0 ? money(l.price, order.currency) : d.orders.tbc}
                  </p>
                  <p className="font-semibold tabular-nums text-ink">{l.price > 0 ? money(l.qty * l.price, order.currency) : "—"}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-line bg-cream/70 px-4 py-4 sm:px-6">
            <span className="font-semibold text-ink">{d.orders.total}</span>
            <span className="font-display text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">
              {money(order.total, order.currency)}
              {order.hasTbc ? " +" : ""}
            </span>
          </div>
        </section>

        {/* Details + history */}
        <div className="space-y-4 sm:space-y-5">
          {details.length > 0 && (
            <section className={`${pcard} p-4 sm:p-5`}>
              <dl className="space-y-3 text-sm">
                {details.map((x) => (
                  <div key={x.k}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted">{x.k}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-ink">{x.v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
          {order.events.length > 0 && (
            <section className={`${pcard} p-4 sm:p-5`}>
              <h2 className="mb-4 text-sm font-semibold text-ink">{d.orders.history}</h2>
              <ol className="relative space-y-4 pl-6 before:absolute before:bottom-1.5 before:left-[0.4375rem] before:top-1.5 before:w-px before:bg-line">
                {order.events.map((e, i) => (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-6 top-1 grid size-3.5 place-items-center rounded-full ring-4 ring-white ${i === order.events.length - 1 ? "bg-ink" : "bg-zinc-300"}`}
                      aria-hidden
                    />
                    <p className="text-sm font-medium text-ink">{eventLabel(e.kind)}</p>
                    <p className="text-xs text-muted">
                      {formatDate(e.at, lang, true)} · {e.actor}
                    </p>
                    {e.changes.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5 text-xs text-ink-soft">
                        {e.changes.map((c) => (
                          <li key={c.item} className="tabular-nums">
                            <span className="font-medium text-ink">{c.description}</span>{" "}
                            {c.from === 0
                              ? `· ${d.orders.added} ${c.to} ${c.uom.toLowerCase()}`
                              : c.to === 0
                                ? `· ${d.orders.removed}`
                                : `· ${c.from} → ${c.to} ${c.uom.toLowerCase()}`}
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.message && <p className="mt-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-ink-soft">“{e.message}”</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
