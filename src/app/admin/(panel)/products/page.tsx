import Link from "next/link";
import { adminBrands, adminCategories, adminProducts } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Badge, Card, EmptyState, NewButton } from "@/components/admin/ui";
import { ListSearch } from "@/components/admin/list-search";

export const metadata = { title: "Products" };

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

  return (
    <>
      <AdminHeader title="Products" description={`${products.length} products`} action={<NewButton href="/admin/products/new" label="New product" />} />
      <ListSearch
        placeholder="Search products…"
        filters={[{ name: "category", label: "All categories", options: categories.map((c) => ({ value: c.slug, label: `${c.parent_id ? "— " : ""}${c.name.en}` })) }]}
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState>No products match.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((p) => {
              const img = mediaUrl(p.images[0]?.path);
              return (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-cream sm:gap-4 sm:px-4">
                    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img && <img src={img} alt="" className="h-full w-full object-contain p-0.5" loading="lazy" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{p.name.en}</span>
                      <span className="block truncate text-xs text-muted">
                        {[brandName.get(p.brand_id ?? ""), cat.get(p.category_id ?? "")?.name.en, p.net_weight].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="hidden shrink-0 gap-1.5 sm:flex">
                      {p.is_featured && <Badge tone="amber">Featured</Badge>}
                      {!p.is_published && <Badge>Hidden</Badge>}
                    </span>
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
