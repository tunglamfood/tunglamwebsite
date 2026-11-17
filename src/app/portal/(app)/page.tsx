import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ArrowRight, ArrowUpRight, Megaphone, Package, Star } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getAnnouncements, getOrders, getUsualItems } from "@/lib/portal/data";
import { pfmt } from "@/lib/portal/i18n";
import { ReorderButton } from "@/components/portal/order-actions";
import { EmptyCard, OrderList } from "@/components/portal/bits";
import { AssistantIcon } from "@/components/portal/assistant-icon";

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
