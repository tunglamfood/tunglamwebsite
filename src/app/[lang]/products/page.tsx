import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { CatalogBrowser } from "@/components/product/catalog-browser";
import { toCardData } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/products", title: d.products.metaTitle, description: d.products.metaDescription });
}

export default async function ProductsPage({ params }: PageProps<"/[lang]/products">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const { products, brands, series, brandById, categoryById, seriesOf } = await getCatalog();

  // Keep series order for the list.
  const order = new Map(series.map((s, i) => [s.id, i]));
  const cards = products
    .map((p) => {
      const cat = categoryById.get(p.category_id ?? "");
      const s = seriesOf(cat);
      return { p, s, rank: (s ? order.get(s.id) ?? 9 : 9) * 1000 + p.sort };
    })
    .sort((a, b) => a.rank - b.rank)
    .map(({ p, s }) => toCardData(p, lang, p.brand_id ? brandById.get(p.brand_id) : undefined, s?.slug));

  return (
    <>
      <PageHeader
        cut="tofu-puffs"
        cut2="chili"
        crumbs={[
          { name: d.common.breadcrumbHome, href: localePath(lang) },
          { name: d.products.title, href: localePath(lang, "/products") },
        ]}
        title={d.products.title}
        lead={d.products.intro}
      />
      <section className="container-x py-8 sm:py-12">
        <CatalogBrowser
          products={cards}
          series={series.map((s) => ({ value: s.slug, label: t(s.name, lang) ?? s.slug }))}
          brands={brands.map((b) => ({ value: b.slug, label: b.name }))}
          labels={{
            all: d.products.filterAll,
            series: d.products.filterSeries,
            brand: d.products.filterBrand,
            search: d.products.search,
            noResults: d.products.noResults,
            count: d.products.count,
          }}
        />
      </section>
      <JsonLd data={itemListJsonLd(cards.map((c) => ({ name: c.name, url: c.href, image: c.image })))} />
    </>
  );
}
