import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { LOCALES, fmt, hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { ORG_ID, absoluteUrl, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { ProductGrid, toCardData } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { brandLogoSrc } from "@/components/brand/brand-logos";

export const revalidate = 3600;

export async function generateStaticParams() {
  const { brands } = await getCatalog();
  return LOCALES.flatMap((lang) => brands.map((b) => ({ lang, slug: b.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/brands/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const brand = (await getCatalog()).brands.find((b) => b.slug === slug);
  if (!brand) return { robots: { index: false } };
  return pageMetadata({
    locale: lang,
    path: `/brands/${slug}`,
    title: t(brand.meta_title, lang) ?? brand.name,
    description: t(brand.meta_description, lang) ?? t(brand.tagline, lang) ?? "",
    absoluteTitle: true,
  });
}

export default async function BrandPage({ params }: PageProps<"/[lang]/brands/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const { brands, products, categoryById, seriesOf } = await getCatalog();
  const brand = brands.find((b) => b.slug === slug);
  if (!brand) notFound();

  const cards = products
    .filter((x) => x.brand_id === brand.id)
    .map((x) => toCardData(x, lang, brand, seriesOf(categoryById.get(x.category_id ?? ""))?.slug));
  const logo = brandLogoSrc(brand);
  const description = (t(brand.description, lang) ?? "").split(/\n\n+/).filter(Boolean);

  return (
    <>
      <PageHeader
        cut="egg-tofu"
        cut2="chili"
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.brands.title, href: p("/brands") },
          { name: brand.name, href: p(`/brands/${brand.slug}`) },
        ]}
        title={brand.name}
        lead={t(brand.tagline, lang)}
      >
        <div className="mt-8 grid items-center gap-8 md:grid-cols-[auto_1fr]">
          {logo && (
            <div className="relative h-32 w-48 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]">
              <Image src={logo} alt={`${brand.name} logo`} fill sizes="192px" className="object-contain p-4" />
            </div>
          )}
          <div className="prose-tl max-w-2xl">{description.map((x, i) => <p key={i}>{x}</p>)}</div>
        </div>
      </PageHeader>
      <section className="container-x py-8 sm:py-12">
        <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{fmt(d.brands.productsBy, { brand: brand.name })}</h2>
        <ProductGrid products={cards} priorityCount={4} />
      </section>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Brand",
            name: brand.name,
            url: absoluteUrl(p(`/brands/${brand.slug}`)),
            ...(logo ? { logo: logo.startsWith("http") ? logo : absoluteUrl(logo) } : {}),
            description: t(brand.description, lang),
            parentOrganization: { "@id": ORG_ID },
          },
          itemListJsonLd(cards.map((c) => ({ name: c.name, url: c.href, image: c.image }))),
        ]}
      />
    </>
  );
}
