import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ArrowRight, ArrowUpRight, Megaphone, Package, Star } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang, customerLabel } from "@/lib/portal/context";
import { getAnnouncements, getOrders, getUsualItems } from "@/lib/portal/data";
import { pfmt } from "@/lib/portal/i18n";
import { ReorderButton } from "@/components/portal/order-actions";
import { EmptyCard, OrderList } from "@/components/portal/bits";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

export const metadata = { title: "Home" };

export default async function PortalHome() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  if (!ctx.customer) redirect("/portal/dealers");
  const [orders, notices, usual] = await Promise.all([
    getOrders([ctx.customer.code], 5),
    getAnnouncements(lang),
    getUsualItems(ctx.customer.code),
  ]);
  const usualCount = Object.keys(usual).length;
  const last = orders.find((o) => o.status !== "cancelled");
  const scope = `${ctx.account.id}:${ctx.customer.code}`;
  const name = ctx.account.name || ctx.customer.shortName || ctx.customer.name;

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* Welcome */}
      <SpotlightCard theme="dark" intensity={0.12} spotlightSize={380} className="!rounded-3xl !p-0 text-white" style={{ "--spotlight-card-surface": "#141414" } as React.CSSProperties}>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,rgb(215_25_32/0.35),transparent_60%)]" />
        <div className="p-5 sm:p-8">
          <div className="min-w-0">
            <h1 className="break-words font-display text-[1.75rem] font-bold leading-tight tracking-[-0.025em] sm:text-4xl">{pfmt(d.home.hello, { name })}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="text-white/55">{d.home.orderingFor}</span>
              <span className="font-semibold">{customerLabel(ctx.customer)}</span>
              <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-xs tabular-nums text-white/70">{ctx.customer.code}</span>
              {ctx.customers.length > 1 && (
                <Link href="/portal/dealers" className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/20">
                  <ArrowLeftRight className="size-3.5" aria-hidden /> {d.home.switch}
                </Link>
              )}
            </div>
          </div>
        </div>
      </SpotlightCard>

      {notices.length > 0 && (
        <section aria-label={d.home.notices} className="space-y-2.5">
          {notices.map((n) => (
            <div key={n.id} className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
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
          className="group flex items-center gap-4 rounded-2xl bg-brand p-4 text-white shadow-[0_10px_30px_-14px_rgb(215_25_32/0.8)] transition duration-300 hover:-translate-y-0.5 hover:bg-brand-600 sm:p-5"
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
        {usualCount > 0 && (
          <Link
            href="/portal/products?usual=1"
            className="group flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:p-5"
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
          />
        )}
      </section>

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
        {orders.length === 0 ? <EmptyCard>{d.home.none}</EmptyCard> : <OrderList orders={orders} d={d} lang={lang} />}
      </section>
    </div>
  );
}
