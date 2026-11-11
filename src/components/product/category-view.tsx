import Image from "next/image";
import Link from "next/link";
import type { Catalog, Category } from "@/lib/data";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fmt, localePath, t, type Locale } from "@/lib/i18n";
import { itemListJsonLd } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { FaqList } from "@/components/ui/faq-list";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGrid, toCardData } from "./product-card";
import clsx from "clsx";
import { SERIES_IMAGES } from "@/components/brand/brand-logos";


export function CategoryView({ category, catalog, locale, dict: d }: { category: Category; catalog: Catalog; locale: Locale; dict: Dictionary }) {
  const p = (path: string) => localePath(locale, path);
  const { brandById, categoryById, linesOf, seriesOf, productsIn } = catalog;
  const parent = category.parent_id ? categoryById.get(category.parent_id) : undefined;
  const series = seriesOf(category)!;
  const siblings = linesOf(series.id);
  const products = productsIn(category).map((x) => toCardData(x, locale, x.brand_id ? brandById.get(x.brand_id) : undefined, series.slug));
  const name = t(category.name, locale) ?? category.slug;
  const intro = (t(category.intro, locale) ?? "").split(/\n\n+/).filter(Boolean);
  const faqs = (category.faqs ?? []).map((f) => ({ q: t(f.q, locale) ?? "", a: t(f.a, locale) ?? "" })).filter((f) => f.q && f.a);
  const heroImage = SERIES_IMAGES[series.slug];

  const crumbs = [
    { name: d.common.breadcrumbHome, href: p("/") },
    { name: d.products.title, href: p("/products") },
    ...(parent ? [{ name: t(parent.name, locale) ?? parent.slug, href: p(`/products/${parent.slug}`) }] : []),
    { name, href: p(`/products/${category.slug}`) },
  ];

  return (
    <>
      <PageHeader crumbs={crumbs} title={name} lead={t(category.tagline, locale)} eyebrow={parent ? t(parent.name, locale) : undefined}>
        <nav aria-label={d.products.inRange} className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:mt-8 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
          <Link
            href={p(`/products/${series.slug}`)}
            className={clsx(
              "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
              category.id === series.id ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink/30",
            )}
          >
            {d.products.filterAll}
          </Link>
          {siblings.map((c) => (
            <Link
              key={c.slug}
              href={p(`/products/${c.slug}`)}
              aria-current={c.id === category.id ? "page" : undefined}
              className={clsx(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                c.id === category.id ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink/30",
              )}
            >
              {t(c.name, locale)}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <section className="container-x py-8 sm:py-12">
        <p className="mb-4 sm:mb-5 text-sm text-muted">{fmt(d.products.count, { n: products.length })}</p>
        <ProductGrid products={products} priorityCount={4} />
      </section>

      {(intro.length > 0 || heroImage) && (
        <section className="container-x grid items-start gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="prose-tl text-lg">
            <h2 className="mb-5 font-display text-3xl font-semibold tracking-tight text-ink">{name}</h2>
            {intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          {heroImage && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-card)] lg:aspect-[4/5]">
              <Image src={heroImage} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          )}
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-x max-w-4xl py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.products.faqTitle}</h2>
          <FaqList items={faqs} />
        </section>
      )}

      <JsonLd data={itemListJsonLd(products.map((c) => ({ name: c.name, url: c.href, image: c.image })))} />
    </>
  );
}
