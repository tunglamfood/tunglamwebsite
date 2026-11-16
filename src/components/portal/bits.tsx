import clsx from "clsx";
import type { PortalLang } from "@/lib/portal/i18n";

const TONE: Record<string, string> = {
  submitted: "bg-gold-soft text-[#8a5a10]",
  draft: "bg-sand text-ink-soft",
  confirmed: "bg-sky-50 text-sky-700",
  delivered: "bg-leaf-soft text-leaf",
  cancelled: "bg-brand-50 text-brand-700",
};

export function StatusPill({ status, label }: { status: string; label: string }) {
  return <span className={clsx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status] ?? "bg-sand text-ink-soft")}>{label}</span>;
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

export function PageTitle({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Malaysia's date, yyyy-mm-dd, offset by some days. */
export function myDate(offsetDays = 0) {
  const now = new Date(Date.now() + 8 * 3600_000 + offsetDays * 86400_000);
  return now.toISOString().slice(0, 10);
}
