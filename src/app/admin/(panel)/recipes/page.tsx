import Link from "next/link";
import { adminRecipes } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, NewButton } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Recipes & articles" };

export default async function RecipesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const recipes = await adminRecipes();
  const needle = q.trim().toLowerCase();
  const rows = recipes.filter((r) => !needle || `${r.title.en} ${r.title.ms} ${r.title.zh} ${r.slug}`.toLowerCase().includes(needle));
  return (
    <>
      <AdminHeader
        title="Recipes & articles"
        description="Shown in the Recipes section of the website."
        action={<NewButton href="/admin/recipes/new" label="New article" />}
      />
      <ListSearch placeholder="Search recipes…" />
      <Card>
        {rows.length === 0 ? (
          <EmptyState>Nothing found.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const img = mediaUrl(r.image_path);
              return (
                <li key={r.id}>
                  <Link href={`/admin/recipes/${r.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream sm:gap-4 sm:px-4">
                    <span className="size-11 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.title.en}</span>
                      <span className="block truncate text-xs text-muted">
                        {new Date(r.published_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })}
                        {r.course?.en ? ` · ${r.course.en}` : ""}
                      </span>
                    </span>
                    {!r.is_published && <Badge>Draft</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
