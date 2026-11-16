import Link from "next/link";
import { adminGuides } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, NewButton } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Guides" };

export default async function GuidesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const guides = await adminGuides();
  const needle = q.trim().toLowerCase();
  const rows = guides.filter((g) => !needle || `${g.title.en} ${g.title.ms} ${g.title.zh} ${g.slug}`.toLowerCase().includes(needle));
  return (
    <>
      <AdminHeader
        title="Guides"
        description="Articles in the Guides section (/guides). Auto posts add new ones every day."
        action={<NewButton href="/admin/guides/new" label="New guide" />}
      />
      <ListSearch placeholder="Search guides…" />
      <Card>
        {rows.length === 0 ? (
          <EmptyState>Nothing found.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((g) => {
              const img = mediaUrl(g.image_path);
              return (
                <li key={g.id}>
                  <Link href={`/admin/guides/${g.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream sm:gap-4 sm:px-4">
                    <span className="h-11 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{g.title.en}</span>
                      <span className="block truncate text-xs text-muted">
                        {new Date(g.published_at).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" })} · /guides/{g.slug}
                      </span>
                    </span>
                    {g.source === "auto" && <Badge tone="blue">Auto</Badge>}
                    {!g.is_published && <Badge>Draft</Badge>}
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
