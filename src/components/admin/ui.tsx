import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Inbox, Plus } from "lucide-react";

/* ------------------------------------------------------------------ Buttons */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md";

/** Shared admin button styles (use on <button>, <a> or <Link>). */
export function btnClass(variant: BtnVariant = "secondary", size: BtnSize = "md", className?: string) {
  return clsx(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "h-8 px-2.5 text-[0.8125rem]" : "h-9 px-3.5 text-sm",
    variant === "primary" && "bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_1px_2px_rgb(0_0_0/0.2)] hover:bg-zinc-800",
    variant === "secondary" && "border border-line bg-white text-ink-soft shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-zinc-300 hover:bg-zinc-50 hover:text-ink",
    variant === "ghost" && "text-ink-soft hover:bg-sand hover:text-ink",
    variant === "danger" && "border border-line bg-white text-red-600 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-red-200 hover:bg-red-50",
    className,
  );
}

/** Square icon-only button. */
export const iconBtnClass =
  "grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-sand hover:text-ink disabled:opacity-40";

/* ------------------------------------------------------------------ Page header */

/** Page title row used by every admin page. */
export function AdminHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-ink sm:text-[1.625rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={btnClass("primary")}>
      <Plus className="size-4" /> {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ Surfaces */

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}>{children}</div>;
}

/** Title bar inside a Card. */
export function CardHeader({ title, count, action, className }: { title: ReactNode; count?: number; action?: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5", className)}>
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {title}
        {count !== undefined && <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-muted">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

const TONES = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200/80",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  red: "bg-red-50 text-red-700 ring-red-200/80",
  amber: "bg-amber-50 text-amber-800 ring-amber-200/80",
  blue: "bg-sky-50 text-sky-700 ring-sky-200/80",
} as const;
const DOTS = { neutral: "bg-zinc-400", green: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500", blue: "bg-sky-500" } as const;

export type Tone = keyof typeof TONES;

export function Badge({ children, tone = "neutral", dot = true }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={clsx("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONES[tone])}>
      {dot && <span className={clsx("size-1.5 rounded-full", DOTS[tone])} aria-hidden />}
      {children}
    </span>
  );
}

export function EmptyState({ children, icon: Icon = Inbox }: { children: ReactNode; icon?: typeof Inbox }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-xl border border-line bg-cream text-muted">
        <Icon className="size-5" />
      </span>
      <p className="max-w-sm text-sm text-muted">{children}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Tables */

/**
 * Column headers for a grid-based list (rows are links, so no <table>).
 * Pass the same `grid` template to the header and each row. Hidden on phones, where rows stack.
 */
export function ListHead({ grid, cols }: { grid: string; cols: { label: string; className?: string }[] }) {
  return (
    <div className={clsx("hidden items-center gap-4 border-b border-line bg-cream/60 px-5 py-2.5 text-xs font-medium text-muted md:grid", grid)}>
      {cols.map((c, i) => (
        <span key={i} className={c.className}>
          {c.label}
        </span>
      ))}
    </div>
  );
}

/** Thumbnail cell for list rows. */
export function Thumb({ src, wide, contain }: { src: string | null; wide?: boolean; contain?: boolean }) {
  return (
    <span className={clsx("grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-cream", wide ? "h-10 w-14" : "size-10")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className={clsx("h-full w-full", contain ? "object-contain p-0.5 mix-blend-multiply" : "object-cover")} loading="lazy" />}
    </span>
  );
}

/* ------------------------------------------------------------------ Tabs */

/** Segmented filter tabs that link to ?param=value. */
export function FilterTabs({ tabs, active }: { tabs: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-xl border border-line bg-white p-1 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            aria-current={active === t.key ? "page" : undefined}
            className={clsx(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              active === t.key ? "bg-ink text-white shadow-sm" : "text-ink-soft hover:bg-sand hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={clsx("rounded-md px-1.5 text-xs tabular-nums", active === t.key ? "bg-white/15 text-white" : "bg-sand text-muted")}>{t.count}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
