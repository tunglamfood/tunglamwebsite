import Link from "next/link";
import { UpdatedMark } from "./updates";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import type { PortalDict, PortalLang } from "@/lib/portal/i18n";
import { money, pfmt } from "@/lib/portal/i18n";

/* ------------------------------------------------------------------ Buttons & surfaces */

type BtnVariant = "primary" | "brand" | "secondary" | "danger" | "whatsapp";

/** Flat Tung Lam red; shared by pbtn("primary") and the catalogue's Add buttons. */
export const PRIMARY =
  "bg-brand text-white hover:bg-brand-600";

/** Portal buttons (usable on <button>, <a> and <Link>, from server or client components). */
export function pbtn(variant: BtnVariant = "secondary", size: "md" | "lg" = "md", className?: string) {
  return clsx(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
    size === "lg" ? "h-12 px-5 text-base" : "h-10 px-4 text-sm",
    // Tung Lam red: the portal's main action colour.
    variant === "primary" && PRIMARY,
    variant === "brand" && "bg-brand text-white hover:bg-brand-600",
    variant === "secondary" && "border border-white/80 bg-white/70 text-ink backdrop-blur hover:bg-white",
    variant === "danger" && "border border-white/80 bg-white/70 text-red-600 backdrop-blur hover:bg-red-50",
    variant === "whatsapp" && "bg-[#1fa855] text-white hover:bg-[#1a964b]",
    className,
  );
}

export const pcard = "glass rounded-2xl";

export const pfield =
  "w-full rounded-xl border border-white/80 bg-white/75 px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition placeholder:text-muted/70 hover:border-ink/20 focus:border-ink/40 focus:ring-4 focus:ring-ink/5";

/* ------------------------------------------------------------------ Status */

const TONE: Record<string, { pill: string; dot: string }> = {
  submitted: { pill: "bg-amber-50 text-amber-800 ring-amber-200/80", dot: "bg-amber-500" },
  on_hold: { pill: "bg-amber-50 text-amber-800 ring-amber-200/80", dot: "bg-amber-500" },
  draft: { pill: "bg-zinc-100 text-zinc-700 ring-zinc-200", dot: "bg-zinc-400" },
  confirmed: { pill: "bg-sky-50 text-sky-700 ring-sky-200/80", dot: "bg-sky-500" },
  delivered: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200/80", dot: "bg-emerald-500" },
  cancelled: { pill: "bg-red-50 text-red-700 ring-red-200/80", dot: "bg-red-500" },
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  const t = TONE[status] ?? TONE.draft;
  return (
    <span className={clsx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", t.pill)}>
      <span className={clsx("size-1.5 rounded-full", t.dot)} aria-hidden />
      {label}
    </span>
  );
}

export function formatDate(iso: string | null | undefined, lang: PortalLang, withTime = false) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00+08:00` : iso);
  return d.toLocaleString(lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Kuala_Lumpur",
  });
}

/* ------------------------------------------------------------------ Page title */

export function PageTitle({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
      <div className="min-w-0">
        <h1 className="font-display text-[1.625rem] font-bold tracking-[-0.025em] text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyCard({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={clsx(pcard, "flex flex-col items-center gap-4 px-6 py-12 text-center")}>
      <p className="max-w-sm text-ink-soft">{children}</p>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Orders list */

type OrderRow = {
  orderNo: string;
  status: string;
  orderDate: string | null;
  deliverOn: string | null;
  lines: unknown[];
  total: number;
  currency: string;
  hasTbc?: boolean;
};

const ORDER_GRID = "md:grid-cols-[minmax(0,1fr)_8rem_8rem_5rem_8rem_11rem_1rem]";

/** Orders as a table on desktop and compact rows on phones. Totals come from the ERP as-is. */
export function OrderList({
  orders,
  d,
  lang,
  scope,
  updates,
}: {
  orders: OrderRow[];
  d: PortalDict;
  lang: PortalLang;
  /** With these, orders Tung Lam changed since the dealer last opened them are marked "Updated". */
  scope?: string;
  updates?: Record<string, string>;
}) {
  const c = d.orders.cols;
  return (
    <div className={clsx(pcard, "overflow-hidden")}>
      <div className={clsx("hidden items-center gap-4 border-b border-line bg-white/40 px-5 py-2.5 text-xs font-medium text-muted md:grid", ORDER_GRID)}>
        <span>{c.order}</span>
        <span>{c.placed}</span>
        <span>{c.delivery}</span>
        <span className="text-right">{c.items}</span>
        <span className="text-right">{c.total}</span>
        <span>{c.status}</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {orders.map((o) => (
          <li key={o.orderNo}>
            <Link
              href={`/portal/orders/${encodeURIComponent(o.orderNo)}`}
              className={clsx("group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 transition-colors hover:bg-white/60 md:gap-4 md:px-5", ORDER_GRID)}
            >
              <span className="min-w-0">
                <span className="block font-semibold tabular-nums text-ink">
                  {o.orderNo}
                  {scope && <UpdatedMark scope={scope} orderNo={o.orderNo} at={updates?.[o.orderNo]} label={d.orders.updated} />}
                </span>
                <span className="block truncate text-sm text-muted md:hidden">
                  {formatDate(o.orderDate, lang)} · {pfmt(d.orders.items, { n: o.lines.length })}
                </span>
              </span>
              <span className="hidden text-sm text-ink-soft md:block">{formatDate(o.orderDate, lang)}</span>
              <span className="hidden text-sm text-ink-soft md:block">{formatDate(o.deliverOn, lang)}</span>
              <span className="hidden text-right text-sm tabular-nums text-ink-soft md:block">{o.lines.length}</span>
              <span className="text-right font-semibold tabular-nums text-ink">
                {money(o.total, o.currency)}
                {o.hasTbc ? " +" : ""}
              </span>
              <span className="col-span-2 md:col-span-1">
                <StatusPill status={o.status} label={(d.orders.status as Record<string, string>)[o.status] ?? o.status} />
              </span>
              <ChevronRight className="hidden size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink md:block" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Malaysia's date, yyyy-mm-dd, offset by some days. */
export function myDate(offsetDays = 0) {
  const now = new Date(Date.now() + 8 * 3600_000 + offsetDays * 86400_000);
  return now.toISOString().slice(0, 10);
}
