import { FileText, ImageIcon } from "lucide-react";
import { requireCustomer, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getOrders, getPayments } from "@/lib/portal/data";
import { money } from "@/lib/portal/i18n";
import { EmptyCard, PageTitle, StatusPill, formatDate, myDate, pcard } from "@/components/portal/bits";
import { PaymentForm } from "@/components/portal/payment-form";

export const metadata = { title: "Payments" };

/** The order-status colours the payment states borrow. */
const TONE = { submitted: "submitted", checked: "delivered", rejected: "cancelled" } as const;

export default async function PortalPayments({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const [{ order }, ctx, d, lang] = await Promise.all([searchParams, requireCustomer(), getPortalDict(), getPortalLang()]);
  const [payments, orders] = await Promise.all([getPayments(ctx.customer.code), getOrders([ctx.customer.code], 30)]);
  const orderNos = orders.filter((o) => o.status !== "cancelled").map((o) => o.orderNo);
  const p = d.payments;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageTitle title={p.title} sub={p.intro} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <PaymentForm
          labels={p}
          orders={orderNos}
          defaultOrder={order && orderNos.includes(order) ? order : null}
          today={myDate()}
        />
        <section>
          <h2 className="mb-3 font-display text-lg font-bold tracking-[-0.015em] text-ink">{p.history}</h2>
          {payments.length === 0 ? (
            <EmptyCard>{p.empty}</EmptyCard>
          ) : (
            <ul className={`${pcard} divide-y divide-line overflow-hidden`}>
              {payments.map((x) => (
                <li key={x.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-muted ring-1 ring-line">
                    {x.fileType === "application/pdf" ? <FileText className="size-4" /> : <ImageIcon className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold tabular-nums text-ink">{money(x.amount, x.currency)}</span>
                      <StatusPill status={TONE[x.status]} label={p.status[x.status]} />
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatDate(x.paidOn, lang)}
                      {x.orderNo ? ` · ${x.orderNo}` : ""}
                      {x.reference ? ` · ${x.reference}` : ""}
                    </p>
                    {x.officeNote && (
                      <p className="mt-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-ink-soft">
                        <span className="font-semibold">{p.officeNote}:</span> {x.officeNote}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
