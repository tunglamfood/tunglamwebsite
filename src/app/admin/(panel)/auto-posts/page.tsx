import Link from "next/link";
import { adminAutoPosts, adminAutoSettings } from "@/lib/admin/queries";
import { AdminHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { AddTopic, AutoToggle, PostActions, RunButtons } from "./auto-controls";

export const metadata = { title: "Auto posts" };
/** "Write one now" runs the whole pipeline inside the server action. */
export const maxDuration = 300;

const STATUS: Record<string, { label: string; tone: "neutral" | "green" | "red" | "amber" | "blue" }> = {
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

  return (
    <>
      <AdminHeader
        title="Auto posts"
        description="Every day at about 9am, 1pm and 5pm the website writes and publishes one new post (2 recipes + 1 guide) in English, BM and 中文, with its own photo."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-4 p-4 sm:p-5">
          <AutoToggle enabled={settings.enabled} />
          <p className="text-sm text-muted">
            Published today: <span className="font-semibold text-ink">{publishedToday}</span> · Daily plan: {settings.slots.join(", ")}
          </p>
          <RunButtons />
          <p className="text-xs leading-relaxed text-muted">
            Each post is checked before publishing: no pork or alcohol, no invented company facts, prices, shelf life or health claims, no duplicates of existing content,
            and an AI editor review. Posts that fail are listed under “Needs attention” and never go live. Edit or delete published posts in Recipes or Guides.
          </p>
        </Card>
        <Card className="p-4 sm:p-5">
          <AddTopic />
        </Card>
      </div>

      <div className="space-y-4">
        {groups.map((g) =>
          g.items.length === 0 && g.title !== "Published" ? null : (
            <Card key={g.title}>
              <p className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
                {g.title} <span className="font-normal text-muted">{g.items.length}</span>
              </p>
              {g.items.length === 0 ? (
                <EmptyState>Nothing yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-line">
                  {g.items.slice(0, 60).map((p) => {
                    const s = STATUS[p.status];
                    const href = p.slug ? `/${p.kind === "recipe" ? "recipes" : "guides"}/${p.slug}` : null;
                    return (
                      <li key={p.id} className="flex flex-wrap items-start gap-3 px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 text-sm text-ink">
                            <Badge tone={p.kind === "recipe" ? "neutral" : "blue"}>{p.kind === "recipe" ? "Recipe" : "Guide"}</Badge>
                            {p.status === "published" && href ? (
                              <Link href={href} target="_blank" className="font-medium hover:text-brand">
                                {p.topic.title}
                              </Link>
                            ) : (
                              <span className="font-medium">{p.topic.title}</span>
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {p.status === "published" && p.published_at ? `Published ${fmt(p.published_at)}` : `Updated ${fmt(p.updated_at)}`} · keyword “{p.keyword}”
                          </p>
                          {p.error && (p.status === "rejected" || p.status === "failed") && <p className="mt-1 line-clamp-3 text-xs text-brand-700">{p.error}</p>}
                        </div>
                        <Badge tone={s.tone}>{s.label}</Badge>
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
