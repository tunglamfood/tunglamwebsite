import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { adminBrands, adminCategories, adminFaqs, adminGuides, adminInquiries, adminProducts, adminRecipes } from "@/lib/admin/queries";
import { mediaUrl } from "@/lib/media";
import { AdminHeader, Card, CardHeader, EmptyState, Thumb } from "@/components/admin/ui";
import { inputClass } from "@/components/admin/styles";

export const metadata = { title: "Search" };

type Hit = { href: string; title: string; sub?: string; img?: string | null; wide?: boolean; contain?: boolean };

export default async function SearchAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const needle = q.trim().toLowerCase();
  const has = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" ").toLowerCase().includes(needle);

  let groups: { title: string; hits: Hit[] }[] = [];
  if (needle) {
    const [products, recipes, guides, faqs, categories, brands, inquiries] = await Promise.all([
      adminProducts(),
      adminRecipes(),
      adminGuides(),
      adminFaqs(),
      adminCategories(),
      adminBrands(),
      adminInquiries("all"),
    ]);
    groups = [
      {
        title: "Products",
        hits: products
          .filter((p) => has(p.name.en, p.name.ms, p.name.zh, p.slug))
          .map((p) => ({ href: `/admin/products/${p.id}`, title: p.name.en ?? p.slug, sub: p.net_weight ?? undefined, img: mediaUrl(p.images[0]?.path), contain: true })),
      },
      {
        title: "Recipes & articles",
        hits: recipes
          .filter((r) => has(r.title.en, r.title.ms, r.title.zh, r.slug))
          .map((r) => ({ href: `/admin/recipes/${r.id}`, title: r.title.en ?? r.slug, sub: `/recipes/${r.slug}`, img: mediaUrl(r.image_path), wide: true })),
      },
      {
        title: "Guides",
        hits: guides
          .filter((g) => has(g.title.en, g.title.ms, g.title.zh, g.slug))
          .map((g) => ({ href: `/admin/guides/${g.id}`, title: g.title.en ?? g.slug, sub: `/guides/${g.slug}`, img: mediaUrl(g.image_path), wide: true })),
      },
      {
        title: "Categories",
        hits: categories.filter((c) => has(c.name.en, c.name.ms, c.name.zh, c.slug)).map((c) => ({ href: `/admin/categories/${c.id}`, title: c.name.en ?? c.slug, sub: `/products/${c.slug}` })),
      },
      { title: "Brands", hits: brands.filter((b) => has(b.name, b.slug)).map((b) => ({ href: `/admin/brands/${b.id}`, title: b.name })) },
      {
        title: "FAQs",
        hits: faqs.filter((f) => has(f.question.en, f.question.ms, f.question.zh, f.answer.en)).map((f) => ({ href: `/admin/faqs/${f.id}`, title: f.question.en ?? "", sub: f.answer.en ?? undefined })),
      },
      {
        title: "Enquiries",
        hits: inquiries
          .filter((x) => has(x.name, x.company, x.email, x.phone, x.message))
          .map((x) => ({ href: `/admin/inquiries?status=all&open=${x.id}`, title: x.name, sub: x.message ?? x.company ?? undefined })),
      },
    ].filter((g) => g.hits.length);
  }
  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  return (
    <>
      <AdminHeader title="Search" description={needle ? `${total} result${total === 1 ? "" : "s"} for “${q.trim()}”` : "Find products, recipes, guides, FAQs and enquiries."} />
      <form action="/admin/search" className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} autoFocus placeholder="Search…" className={`${inputClass} h-11 pl-9`} />
      </form>
      {needle && groups.length === 0 && (
        <Card>
          <EmptyState icon={Search}>Nothing matches “{q.trim()}”.</EmptyState>
        </Card>
      )}
      <div className="space-y-4">
        {groups.map((g) => (
          <Card key={g.title} className="overflow-hidden">
            <CardHeader title={g.title} count={g.hits.length} />
            <ul className="divide-y divide-line">
              {g.hits.slice(0, 20).map((h) => (
                <li key={h.href}>
                  <Link href={h.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream sm:px-5">
                    {h.img !== undefined && <Thumb src={h.img} wide={h.wide} contain={h.contain} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{h.title}</span>
                      {h.sub && <span className="block truncate text-xs text-muted">{h.sub}</span>}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
