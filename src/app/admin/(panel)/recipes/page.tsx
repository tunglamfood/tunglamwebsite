import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { adminRecipes } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, ListHead, NewButton, Thumb } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Recipes & articles" };

const GRID = "md:grid-cols-[minmax(0,1fr)_7rem_7.5rem_5.5rem_6rem_1rem]";
const date = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

export default async function RecipesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const recipes = await adminRecipes();
  const needle = q.trim().toLowerCase();
  const rows = recipes.filter((r) => !needle || `${r.title.en} ${r.title.ms} ${r.title.zh} ${r.slug}`.toLowerCase().includes(needle));
  const auto = recipes.filter((r) => r.source === "auto").length;
  return (
    <>
      <AdminHeader
        title="Recipes & articles"
        description={`${recipes.length} in the Recipes section of the website${auto ? ` · ${auto} written by Auto posts` : ""}.`}
        action={<NewButton href="/admin/recipes/new" label="New article" />}
      />
      <ListSearch placeholder="Search recipes…" />
      <Card className="overflow-hidden">
        <ListHead grid={GRID} cols={[{ label: "Recipe" }, { label: "Course" }, { label: "Published" }, { label: "Source" }, { label: "Status" }, { label: "" }]} />
        {rows.length === 0 ? (
          <EmptyState>Nothing found.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/recipes/${r.id}`}
                  className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-cream md:gap-4 md:px-5 ${GRID}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Thumb src={mediaUrl(r.image_path)} wide />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium text-ink md:line-clamp-1">{r.title.en}</span>
                      <span className="block truncate text-xs text-muted md:hidden">
                        {date(r.published_at)}
                        {r.course?.en ? ` · ${r.course.en}` : ""}
                        {r.source === "auto" ? " · Auto" : ""}
                      </span>
                      <span className="hidden truncate text-xs text-muted md:block">/recipes/{r.slug}</span>
                    </span>
                  </span>
                  <span className="hidden truncate text-sm text-ink-soft md:block">{r.course?.en || "—"}</span>
                  <span className="hidden text-sm tabular-nums text-ink-soft md:block">{date(r.published_at)}</span>
                  <span className="hidden md:block">{r.source === "auto" ? <Badge tone="blue">Auto</Badge> : <span className="text-sm text-ink-soft">Manual</span>}</span>
                  <span>{r.is_published ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}</span>
                  <ChevronRight className="hidden size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink md:block" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
