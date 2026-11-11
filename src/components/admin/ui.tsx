import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Plus } from "lucide-react";

/** Page title row used by every admin list page. */
export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3.5 text-sm font-semibold text-white hover:bg-ink/90">
      <Plus className="size-4" /> {label}
    </Link>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border border-line bg-white", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "red" | "amber" | "blue" }) {
  const tones = {
    neutral: "bg-sand text-ink-soft",
    green: "bg-leaf-soft text-leaf",
    red: "bg-brand-50 text-brand-700",
    amber: "bg-gold-soft text-[#9a6412]",
    blue: "bg-sky-50 text-sky-700",
  };
  return <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-4 py-12 text-center text-sm text-muted">{children}</p>;
}

/** Simple filter tabs that link to ?param=value. */
export function FilterTabs({ tabs, active }: { tabs: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={clsx(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm transition",
            active === t.key ? "bg-white font-semibold text-ink ring-1 ring-line" : "text-muted hover:text-ink",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs text-muted">{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}
