import { redirect } from "next/navigation";
import { Camera, MapPin } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getVisits } from "@/lib/portal/data";
import { pfmt } from "@/lib/portal/i18n";
import { EmptyCard, PageTitle, formatDate, pcard } from "@/components/portal/bits";
import { VisitPanel } from "@/components/portal/visit-panel";

export const metadata = { title: "Visits" };

export default async function PortalVisits() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  if (ctx.account.role !== "rep" || !ctx.account.repCode) redirect("/portal");
  const v = d.visits;
  const visits = await getVisits(ctx.account.repCode);
  const open = visits.find((x) => !x.checkedOutAt) ?? null;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en-MY", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageTitle title={v.title} sub={v.intro} />
      <VisitPanel
        labels={v}
        dealer={ctx.customer ? ctx.customer.shortName || ctx.customer.name : null}
        open={open ? { dealer: open.dealer, since: time(open.checkedInAt), photos: open.photos, located: open.located } : null}
      />
      <section>
        <h2 className="mb-3 font-display text-lg font-bold tracking-[-0.015em] text-ink">{v.recent}</h2>
        {visits.length === 0 ? (
          <EmptyCard>{v.empty}</EmptyCard>
        ) : (
          <ul className={`${pcard} divide-y divide-line overflow-hidden`}>
            {visits.map((x) => (
              <li key={x.id} className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-muted ring-1 ring-line">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{x.dealer}</p>
                  <p className="text-sm text-muted">
                    {formatDate(x.checkedInAt, lang)} · {time(x.checkedInAt)}
                    {x.checkedOutAt ? ` – ${time(x.checkedOutAt)} · ${pfmt(v.minutes, { m: x.minutes ?? 0 })}` : ` · ${v.open}`}
                  </p>
                  {(x.outcome || x.note) && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">
                      {x.outcome ? (v.outcomes as Record<string, string>)[x.outcome] : ""}
                      {x.outcome && x.note ? " · " : ""}
                      {x.note}
                    </p>
                  )}
                </div>
                {x.photos > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                    <Camera className="size-3.5" /> {x.photos}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
