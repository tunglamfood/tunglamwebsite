import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ArrowRight, ArrowUpRight, BellDot, MapPin, Megaphone, Package, Star } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getAnnouncements, getOrderUpdates, getOrders, getRepProgress, getStatement, getUsualItems } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { ReorderButton } from "@/components/portal/order-actions";
import { EmptyCard, OrderList, StatusPill, formatDate, pcard } from "@/components/portal/bits";
import { UpdatedMark } from "@/components/portal/updates";
import { AssistantIcon } from "@/components/portal/assistant-icon";

export const metadata = { title: "Home" };

export default async function PortalHome() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  if (!ctx.customer) redirect("/portal/dealers");
  const [orders, notices, usual, updates] = await Promise.all([
    getOrders([ctx.customer.code], 5),
    getAnnouncements(lang),
    getUsualItems(ctx.customer.code),
    getOrderUpdates([ctx.customer.code], 14),
  ]);
  const isRep = ctx.account.role === "rep" && !!ctx.account.repCode;
  const [progress, owes] = isRep
    ? await Promise.all([getRepProgress(ctx.account.repCode!), getStatement(ctx.customer.code)])
    : [null, null];
  const updateAt = Object.fromEntries(updates.map((u) => [u.orderNo, u.at]));
  const eventLabel = (k: string) => (d.orders.events as Record<string, string>)[k] ?? k;
  const statusLabel = (k: string) => (d.orders.status as Record<string, string>)[k] ?? k;
  const usualCount = Object.keys(usual).length;
  const last = orders.find((o) => o.status !== "cancelled");
  const scope = `${ctx.account.id}:${ctx.customer.code}`;
  const name = ctx.account.name || ctx.customer.shortName || ctx.customer.name;

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Welcome */}
      <section className="glass rounded-3xl">
        <div className="p-5 sm:p-8">
          <div className="min-w-0">
            <h1 className="break-words font-display text-[1.75rem] font-bold leading-tight tracking-[-0.025em] text-ink sm:text-4xl">{pfmt(d.home.hello, { name })}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-muted">{d.home.orderingFor}</span>
              <span className="font-semibold text-ink">{ctx.customer.name}</span>
              {ctx.customers.length > 1 && (
                <Link href="/portal/dealers" className="inline-flex items-center gap-1 rounded-lg border border-white/80 bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-white">
                  <ArrowLeftRight className="size-3.5" aria-hidden /> {d.home.switch}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {notices.length > 0 && (
        <section aria-label={d.home.notices} className="space-y-2.5">
          {notices.map((n) => (
            <div key={n.id} className="flex gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 backdrop-blur">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-amber-600 shadow-[var(--shadow-xs)]">
                <Megaphone className="size-[1.125rem]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{n.title}</p>
                {n.body && <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-soft">{n.body}</p>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Quick actions */}
      <section className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <Link
          href="/portal/products"
          className="group flex items-center gap-4 rounded-2xl bg-brand p-4 text-white transition duration-300 hover:bg-brand-600 sm:p-5"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
            <Package className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{d.home.start}</span>
            <span className="block text-sm text-white/80">{d.home.startText}</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
        </Link>
        <Link
          href="/portal/assistant"
          className="glass group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 transition duration-300 hover:bg-white/80 sm:p-5"
        >
          <AssistantIcon size={56} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 font-semibold text-ink">
              {d.home.aiTitle}
              <span className="rounded-md bg-brand px-1.5 py-px text-[0.6rem] font-bold tracking-wide text-white">AI</span>
            </span>
            <span className="block text-sm text-muted">{d.home.aiText}</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 text-brand transition duration-300 group-hover:rotate-45" aria-hidden />
        </Link>
        {usualCount > 0 && (
          <Link
            href="/portal/products?usual=1"
            className="glass group flex items-center gap-4 rounded-2xl p-4 transition duration-300 hover:bg-white/80 sm:p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Star className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{d.home.usual}</span>
              <span className="block text-sm text-muted">{pfmt(d.home.usualText, { n: usualCount })}</span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted transition duration-300 group-hover:rotate-45 group-hover:text-ink" aria-hidden />
          </Link>
        )}
        {last && (
          <ReorderButton
            scope={scope}
            lines={last.lines.map((l) => ({ itemCode: l.itemCode, qty: l.qty }))}
            title={d.home.reorder}
            text={pfmt(d.home.reorderText, { no: last.orderNo })}
            done={d.orders.reordered}
          />
        )}
      </section>

      {progress && (
        <section className="glass rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-ink">{d.home.myMonth}</h2>
            <span className="text-sm text-muted">{pfmt(d.home.monthOrders, { n: progress.orders })}</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">
            {money(progress.value, ctx.customer.currency)}
            {progress.target ? <span className="text-base font-medium text-muted"> / {money(progress.target, ctx.customer.currency)}</span> : null}
          </p>
          {progress.target ? (
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/80 ring-1 ring-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, Math.round((progress.value / progress.target) * 100))}%` }} />
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">{d.home.noTarget}</p>
          )}
          {progress.unpricedLines > 0 && <p className="mt-2 text-xs text-muted">{pfmt(d.home.unpriced, { n: progress.unpricedLines })}</p>}
        </section>
      )}

      {owes?.asOf && owes.total !== 0 && (
        <Link href="/portal/account" className={`glass flex items-center gap-4 rounded-2xl p-4 transition hover:bg-white/80 sm:p-5 ${owes.overdue > 0 ? "ring-1 ring-red-200" : ""}`}>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{pfmt(d.home.owes, { name: ctx.customer.shortName || ctx.customer.name })}</span>
            <span className="block text-sm text-muted">{pfmt(d.account.asOf, { date: owes.asOf })}</span>
          </span>
          <span className="text-right">
            <span className="block font-display text-lg font-bold tabular-nums text-ink">{money(owes.total, ctx.customer.currency)}</span>
            {owes.overdue > 0 && <span className="block text-xs font-semibold text-red-600">{pfmt(d.account.overdueAmount, { amount: money(owes.overdue, ctx.customer.currency) })}</span>}
          </span>
        </Link>
      )}

      {ctx.account.role === "rep" && (
        <Link href="/portal/visits" className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:bg-white/80 sm:p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <MapPin className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">{d.visits.cta}</span>
            <span className="block text-sm text-muted">{d.visits.intro}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}

      {/* What Tung Lam did with the dealer's orders lately */}
      {updates.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold tracking-[-0.015em] text-ink sm:text-xl">
            <BellDot className="size-5 text-brand" aria-hidden /> {d.home.updatesTitle}
          </h2>
          <ul className={`${pcard} divide-y divide-line overflow-hidden`}>
            {updates.slice(0, 3).map((u) => (
              <li key={u.orderNo}>
                <Link href={`/portal/orders/${encodeURIComponent(u.orderNo)}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/60 sm:px-5">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold tabular-nums text-ink">
                      {u.orderNo}
                      <UpdatedMark scope={scope} orderNo={u.orderNo} at={u.at} label={d.orders.updated} />
                    </span>
                    <span className="block text-sm text-muted">
                      {eventLabel(u.kind)} · {formatDate(u.at, lang, true)}
                      {u.deliverOn && u.kind === "confirmed" ? ` · ${pfmt(d.orders.deliverOn, { date: formatDate(u.deliverOn, lang) })}` : ""}
                    </span>
                  </span>
                  {["confirmed", "delivered", "cancelled", "on_hold"].includes(u.kind) && (
                    <StatusPill status={u.kind} label={statusLabel(u.kind)} />
                  )}
                  <ArrowRight className="size-4 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recent orders */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink sm:text-xl">{d.home.recent}</h2>
          {orders.length > 0 && (
            <Link href="/portal/orders" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              {d.home.viewAll} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          )}
        </div>
        {orders.length === 0 ? <EmptyCard>{d.home.none}</EmptyCard> : <OrderList orders={orders} d={d} lang={lang} scope={scope} updates={updateAt} />}
      </section>
    </div>
  );
}
