import Link from "next/link";
import { adminCategories, adminProducts } from "@/lib/admin/queries";
import { AdminHeader, Card, NewButton } from "@/components/admin/ui";

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
            <Card key={s.id}>
              <Link href={`/admin/categories/${s.id}`} className="flex items-center justify-between border-b border-line px-4 py-3 hover:bg-cream">
                <span className="text-sm font-semibold text-ink">{s.name.en}</span>
                <span className="text-xs text-muted">{total} products</span>
              </Link>
              <ul className="divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/categories/${l.id}`} className="flex items-center justify-between px-4 py-2.5 pl-8 text-sm hover:bg-cream">
                      <span className="text-ink-soft">{l.name.en}</span>
                      <span className="text-xs text-muted">{count(l.id)}</span>
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
