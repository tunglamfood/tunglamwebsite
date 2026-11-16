import Link from "next/link";
import { ChevronRight, CornerDownRight } from "lucide-react";
import { adminCategories, adminProducts } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { SERIES_IMAGES } from "@/components/brand/brand-logos";
import { AdminHeader, Card, NewButton, Thumb } from "@/components/admin/ui";

export const metadata = { title: "Categories" };

export default async function CategoriesAdmin() {
  const [categories, products] = await Promise.all([adminCategories(), adminProducts()]);
  const count = (id: string) => products.filter((p) => p.category_id === id).length;
  const series = categories.filter((c) => !c.parent_id);
  return (
    <>
      <AdminHeader title="Categories" description="Series and the product lines inside them." action={<NewButton href="/admin/categories/new" label="New category" />} />
      <div className="space-y-4">
        {series.map((s) => {
          const lines = categories.filter((c) => c.parent_id === s.id);
          const total = lines.reduce((n, l) => n + count(l.id), count(s.id));
          return (
            <Card key={s.id} className="overflow-hidden">
              <Link href={`/admin/categories/${s.id}`} className="group flex items-center gap-3 border-b border-line bg-cream/60 px-4 py-3 transition-colors hover:bg-cream sm:px-5">
                <Thumb src={mediaUrl(s.image_path) ?? SERIES_IMAGES[s.slug] ?? null} wide />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{s.name.en}</span>
                  <span className="block text-xs text-muted">
                    Series · {lines.length} lines · {total} products
                  </span>
                </span>
                <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
              <ul className="divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/categories/${l.id}`} className="group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-cream sm:px-5">
                      <CornerDownRight className="ml-2 size-3.5 shrink-0 text-zinc-300" />
                      <span className="min-w-0 flex-1 truncate text-ink-soft group-hover:text-ink">{l.name.en}</span>
                      <span className="rounded-md bg-sand px-1.5 py-0.5 text-xs tabular-nums text-muted">{count(l.id)}</span>
                      <ChevronRight className="size-4 text-muted opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
