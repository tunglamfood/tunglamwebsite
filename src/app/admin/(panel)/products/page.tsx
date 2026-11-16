import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { adminBrands, adminCategories, adminProducts } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, ListHead, NewButton, Thumb } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Products" };

const GRID = "md:grid-cols-[minmax(0,1fr)_6.5rem_10rem_5.5rem_6rem_1rem]";

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const [products, brands, categories] = await Promise.all([adminProducts(), adminBrands(), adminCategories()]);
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  const cat = new Map(categories.map((c) => [c.id, c]));
  const needle = q.trim().toLowerCase();
  const rows = products.filter((p) => {
    const c = cat.get(p.category_id ?? "");
    const inCat = !category || c?.slug === category || cat.get(c?.parent_id ?? "")?.slug === category;
    const text = `${p.name.en ?? ""} ${p.name.ms ?? ""} ${p.name.zh ?? ""} ${p.slug}`.toLowerCase();
    return inCat && (!needle || text.includes(needle));
  });
  const hidden = products.filter((p) => !p.is_published).length;

  return (
    <>
      <AdminHeader
        title="Products"
        description={`${products.length} products · ${products.length - hidden} published${hidden ? ` · ${hidden} hidden` : ""}`}
        action={<NewButton href="/admin/products/new" label="New product" />}
      />
      <ListSearch
        placeholder="Search products…"
        filters={[{ name: "category", label: "All categories", options: categories.map((c) => ({ value: c.slug, label: `${c.parent_id ? "— " : ""}${c.name.en}` })) }]}
      />
      <Card className="overflow-hidden">
        <ListHead
          grid={GRID}
          cols={[{ label: "Product" }, { label: "Brand" }, { label: "Category" }, { label: "Size" }, { label: "Status" }, { label: "" }]}
        />
        {rows.length === 0 ? (
          <EmptyState>No products match.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((p) => {
              const brand = brandName.get(p.brand_id ?? "");
              const category = cat.get(p.category_id ?? "")?.name.en;
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-cream md:gap-4 md:px-5 ${GRID}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Thumb src={mediaUrl(p.images[0]?.path)} contain />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                          <span className="line-clamp-2 md:line-clamp-1">{p.name.en}</span>
                          {p.is_featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
                        </span>
                        <span className="block truncate text-xs text-muted md:hidden">{[brand, category, p.net_weight].filter(Boolean).join(" · ")}</span>
                        <span className="hidden truncate text-xs text-muted md:block">/products/{p.slug}</span>
                      </span>
                    </span>
                    <span className="hidden truncate text-sm text-ink-soft md:block">{brand ?? "—"}</span>
                    <span className="hidden truncate text-sm text-ink-soft md:block">{category ?? "—"}</span>
                    <span className="hidden truncate text-sm tabular-nums text-ink-soft md:block">{p.net_weight ?? "—"}</span>
                    <span>{p.is_published ? <Badge tone="green">Live</Badge> : <Badge>Hidden</Badge>}</span>
                    <ChevronRight className="hidden size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink md:block" />
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
