import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, HelpCircle, Inbox, Newspaper, Package, Plus, Sparkles } from "lucide-react";
import { adminAutoPosts, adminAutoSettings, adminCounts, adminGuides, adminInquiries, adminRecipes } from "@/lib/admin/queries";
import { AdminHeader, Badge, Card, CardHeader, EmptyState } from "@/components/admin/ui";
import { RefreshButton } from "@/components/admin/refresh-button";
import { PublishChart, type Week } from "./publish-chart";

export const metadata = { title: "Dashboard" };

const KIND: Record<string, string> = { general: "General", wholesale: "Wholesale", product: "Product", career: "Career" };
const TZ = "Asia/Kuala_Lumpur";
const DAY = 86_400_000;

/** Monday (UTC midnight) of the Malaysian calendar week that contains `iso`. */
function weekStart(iso: string | Date) {
  const ymd = new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
  const d = new Date(`${ymd}T00:00:00Z`);
  return d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY;
}

export default async function Dashboard() {
  const [c, inquiries, recipes, guides, settings, posts] = await Promise.all([
    adminCounts(),
    adminInquiries("all"),
    adminRecipes(),
    adminGuides(),
    adminAutoSettings(),
    adminAutoPosts(),
  ]);

  // Posts published per week, last 12 weeks.
  const thisWeek = weekStart(new Date());
  const weeks: (Week & { start: number })[] = Array.from({ length: 12 }, (_, i) => {
    const start = thisWeek - (11 - i) * 7 * DAY;
    return { start, label: new Date(start).toLocaleDateString("en-MY", { day: "numeric", month: "short", timeZone: "UTC" }), recipes: 0, guides: 0 };
  });
  const byStart = new Map(weeks.map((w) => [w.start, w]));
  for (const r of recipes) {
    const w = r.is_published ? byStart.get(weekStart(r.published_at)) : undefined;
    if (w) w.recipes++;
  }
  for (const g of guides) {
    const w = g.is_published ? byStart.get(weekStart(g.published_at)) : undefined;
    if (w) w.guides++;
  }
  const last12 = weeks.reduce((n, w) => n + w.recipes + w.guides, 0);
  const lastWeek = (list: { published_at: string }[]) => list.filter((x) => Date.now() - new Date(x.published_at).getTime() < 7 * DAY).length;

  const stats = [
    { label: "Products", value: c.products, note: c.unpublished ? `${c.unpublished} hidden` : "All published", href: "/admin/products", icon: Package },
    { label: "Recipes & articles", value: recipes.length, note: `+${lastWeek(recipes)} in the last 7 days`, href: "/admin/recipes", icon: BookOpen },
    { label: "Guides", value: guides.length, note: `+${lastWeek(guides)} in the last 7 days`, href: "/admin/guides", icon: Newspaper },
    { label: "New enquiries", value: c.newInquiries, note: `${c.inquiries} total`, href: "/admin/inquiries?status=new", icon: Inbox },
  ];

  // Auto posts summary.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const publishedToday = posts.filter((p) => p.published_at && new Date(p.published_at).toLocaleDateString("en-CA", { timeZone: TZ }) === today).length;
  const queue = posts.filter((p) => p.status === "planned").reverse();
  const attention = posts.filter((p) => p.status === "rejected" || p.status === "failed").length;
  const perDay = settings.slots.length || 3;

  const actions = [
    { href: "/admin/products/new", label: "Add a product", icon: Package },
    { href: "/admin/recipes/new", label: "Write a recipe", icon: BookOpen },
    { href: "/admin/guides/new", label: "Write a guide", icon: Newspaper },
    { href: "/admin/faqs/new", label: "Add an FAQ", icon: HelpCircle },
  ];

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description={`Overview of tunglamfood.my · ${new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", timeZone: TZ })}`}
        action={<RefreshButton />}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-soft sm:text-sm">
                <s.icon className="hidden size-4 text-muted sm:block" />
                {s.label}
              </span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-300 group-hover:rotate-45 sm:size-8">
                <ArrowUpRight className="size-3.5 sm:size-4" />
              </span>
            </div>
            <p className="mt-3 text-[1.75rem] font-semibold leading-none tracking-tight text-ink tabular-nums sm:mt-5 sm:text-4xl">{s.value}</p>
            <p className="mt-2 truncate text-xs text-muted">{s.note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Chart */}
        <Card className="p-4 sm:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-ink-soft">Posts published per week</h2>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-ink tabular-nums">
                {last12} <span className="text-sm font-normal text-muted">in the last 12 weeks</span>
              </p>
            </div>
            <p className="text-xs text-muted">Recipes + guides, Malaysian time</p>
          </div>
          <PublishChart weeks={weeks.map(({ label, recipes, guides }) => ({ label, recipes, guides }))} />
        </Card>

        {/* Auto posts */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader
            title={
              <>
                <Sparkles className="size-4 text-muted" /> Auto posts
              </>
            }
            action={settings.enabled ? <Badge tone="green">Running</Badge> : <Badge tone="amber">Paused</Badge>}
          />
          <div className="space-y-5 p-4 sm:p-5">
            <div>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted">Published today</span>
                <span className="font-semibold text-ink tabular-nums">
                  {publishedToday} / {perDay}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100" role="meter" aria-valuemin={0} aria-valuemax={perDay} aria-valuenow={publishedToday} aria-label="Posts published today">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (publishedToday / perDay) * 100)}%` }} />
              </div>
              {attention > 0 && <p className="mt-2 text-xs text-red-600">{attention} need attention</p>}
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Next in queue</p>
              {queue.length === 0 ? (
                <p className="text-sm text-muted">The queue is empty; topics are planned automatically.</p>
              ) : (
                <ol className="space-y-2">
                  {queue.slice(0, 4).map((p, i) => (
                    <li key={p.id} className="flex items-start gap-2.5 text-sm">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sand text-[0.7rem] font-semibold text-muted">{i + 1}</span>
                      <span className="line-clamp-2 text-ink-soft">{p.topic.title}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <Link href="/admin/auto-posts" className="mt-auto flex items-center justify-between border-t border-line px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-cream hover:text-ink sm:px-5">
            Manage auto posts <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Recent enquiries */}
        <Card className="overflow-hidden">
          <CardHeader
            title="Recent enquiries"
            count={c.inquiries}
            action={
              <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {inquiries.length === 0 ? (
            <EmptyState>No enquiries yet. Messages from the website forms will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/inquiries?status=all&open=${q.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream sm:px-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-xs font-semibold uppercase text-ink-soft">{q.name.trim().slice(0, 1)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {q.name}
                        {q.company && <span className="font-normal text-muted"> · {q.company}</span>}
                      </p>
                      <p className="truncate text-sm text-muted">{q.message || q.product_slug || "—"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={q.status === "new" ? "red" : "neutral"}>{q.status === "new" ? "New" : KIND[q.kind]}</Badge>
                      <span className="text-xs text-muted">{new Date(q.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="overflow-hidden">
          <CardHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-2 p-3">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex flex-col gap-3 rounded-xl border border-line p-3 text-sm font-medium text-ink-soft transition hover:border-zinc-300 hover:bg-cream hover:text-ink"
              >
                <span className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-lg bg-sand text-ink-soft transition-colors group-hover:bg-ink group-hover:text-white">
                    <a.icon className="size-4" />
                  </span>
                  <Plus className="size-3.5 text-muted" />
                </span>
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
