import Link from "next/link";
import { CalendarClock, CheckCircle2, ListTodo, ShieldCheck } from "lucide-react";
import { adminAutoPosts, adminAutoSettings } from "@/lib/admin/queries";
import { AdminHeader, Badge, Card, CardHeader, EmptyState, type Tone } from "@/components/admin/ui";
import { AddTopic, AutoToggle, PostActions, RunButtons } from "./auto-controls";

export const metadata = { title: "Auto posts" };
/** "Write one now" runs the whole pipeline inside the server action. */
export const maxDuration = 300;

const STATUS: Record<string, { label: string; tone: Tone }> = {
  planned: { label: "Queued", tone: "neutral" },
  writing: { label: "Writing", tone: "amber" },
  imaging: { label: "Making photo", tone: "amber" },
  publishing: { label: "Publishing", tone: "amber" },
  published: { label: "Published", tone: "green" },
  rejected: { label: "Rejected by checks", tone: "red" },
  failed: { label: "Failed", tone: "red" },
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" });

export default async function AutoPostsAdmin() {
  const [settings, posts] = await Promise.all([adminAutoSettings(), adminAutoPosts()]);
  const groups = [
    { title: "In progress", items: posts.filter((p) => ["writing", "imaging", "publishing"].includes(p.status)) },
    { title: "Published", items: posts.filter((p) => p.status === "published") },
    { title: "Needs attention", items: posts.filter((p) => p.status === "rejected" || p.status === "failed") },
    { title: "Queue (next topics)", items: posts.filter((p) => p.status === "planned").reverse() },
  ];
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
  const publishedToday = posts.filter((p) => p.published_at && new Date(p.published_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" }) === today).length;
  const published = posts.filter((p) => p.status === "published").length;
  const queued = posts.filter((p) => p.status === "planned").length;

  const tiles = [
    { label: "Published today", value: `${publishedToday} / ${settings.slots.length}`, icon: CalendarClock },
    { label: "Published in total", value: String(published), icon: CheckCircle2 },
    { label: "Topics in the queue", value: String(queued), icon: ListTodo },
  ];

  return (
    <>
      <AdminHeader
        title="Auto posts"
        description="Every day at about 9am, 1pm and 5pm the website writes and publishes one new post (2 recipes + 1 guide) in English, BM and 中文, with its own photo."
      />

      <div className="mb-4 grid grid-cols-3 gap-2.5 sm:gap-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-3 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted sm:text-sm">{t.label}</p>
              <t.icon className="hidden size-4 text-muted sm:block" />
            </div>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink tabular-nums sm:mt-3 sm:text-3xl">{t.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4 sm:p-5">
          <AutoToggle enabled={settings.enabled} />
          <p className="text-sm text-muted">
            Daily plan: <span className="font-medium text-ink">{settings.slots.join(", ")}</span>
          </p>
          <RunButtons />
          <p className="flex gap-2.5 rounded-xl border border-line bg-cream p-3 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>
              Each post is checked before publishing: no pork or alcohol, no invented company facts, prices, shelf life or health claims, no duplicates of existing content, and an AI editor
              review. Posts that fail are listed under “Needs attention” and never go live. Edit or delete published posts in Recipes or Guides.
            </span>
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <AddTopic />
        </Card>
      </div>

      <div className="space-y-4">
        {groups.map((g) =>
          g.items.length === 0 && g.title !== "Published" ? null : (
            <Card key={g.title} className="overflow-hidden">
              <CardHeader title={g.title} count={g.items.length} />
              {g.items.length === 0 ? (
                <EmptyState>Nothing yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-line">
                  {g.items.slice(0, 60).map((p) => {
                    const s = STATUS[p.status];
                    const href = p.slug ? `/${p.kind === "recipe" ? "recipes" : "guides"}/${p.slug}` : null;
                    return (
                      <li key={p.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                        <span className={`mt-0.5 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide ${p.kind === "recipe" ? "bg-orange-50 text-orange-700" : "bg-sky-50 text-sky-700"}`}>
                          {p.kind === "recipe" ? "Recipe" : "Guide"}
                        </span>
                        <div className="min-w-0 flex-1">
                          {p.status === "published" && href ? (
                            <Link href={href} target="_blank" className="text-sm font-medium text-ink underline-offset-2 hover:underline">
                              {p.topic.title}
                            </Link>
                          ) : (
                            <p className="text-sm font-medium text-ink">{p.topic.title}</p>
                          )}
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {p.status === "published" && p.published_at ? `Published ${fmt(p.published_at)}` : `Updated ${fmt(p.updated_at)}`} · “{p.keyword}”
                          </p>
                          {p.error && (p.status === "rejected" || p.status === "failed") && <p className="mt-1.5 line-clamp-3 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{p.error}</p>}
                        </div>
                        <span className="hidden sm:block">
                          <Badge tone={s.tone}>{s.label}</Badge>
                        </span>
                        <PostActions id={p.id} status={p.status} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ),
        )}
      </div>
    </>
  );
}
