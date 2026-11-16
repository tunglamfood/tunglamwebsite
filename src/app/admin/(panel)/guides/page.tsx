import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { adminGuides } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, ListHead, NewButton, Thumb } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Guides" };

const GRID = "md:grid-cols-[minmax(0,1fr)_7.5rem_5.5rem_6rem_1rem]";
const date = (iso: string) => new Date(iso).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

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
      <Card className="overflow-hidden">
        <ListHead grid={GRID} cols={[{ label: "Guide" }, { label: "Published" }, { label: "Source" }, { label: "Status" }, { label: "" }]} />
        {rows.length === 0 ? (
          <EmptyState>Nothing found.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/admin/guides/${g.id}`}
                  className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-cream md:gap-4 md:px-5 ${GRID}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Thumb src={mediaUrl(g.image_path)} wide />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-sm font-medium text-ink md:line-clamp-1">{g.title.en}</span>
                      <span className="block truncate text-xs text-muted md:hidden">
                        {date(g.published_at)}
                        {g.source === "auto" ? " · Auto" : ""}
                      </span>
                      <span className="hidden truncate text-xs text-muted md:block">/guides/{g.slug}</span>
                    </span>
                  </span>
                  <span className="hidden text-sm tabular-nums text-ink-soft md:block">{date(g.published_at)}</span>
                  <span className="hidden md:block">{g.source === "auto" ? <Badge tone="blue">Auto</Badge> : <span className="text-sm text-ink-soft">Manual</span>}</span>
                  <span>{g.is_published ? <Badge tone="green">Live</Badge> : <Badge>Draft</Badge>}</span>
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
