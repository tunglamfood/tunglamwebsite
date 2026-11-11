import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDictionary } from "@/i18n";
import { LOCALES, hasLocale, t } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { CategoryView } from "@/components/product/category-view";
import { ProductView } from "@/components/product/product-view";

export const revalidate = 3600;

/** /products/[slug] serves both category pages (e.g. /products/egg-tofu) and product pages. */
export async function generateStaticParams() {
  const { categories, products } = await getCatalog();
  const slugs = [...categories.map((c) => c.slug), ...products.map((p) => p.slug)];
  return LOCALES.flatMap((lang) => slugs.map((slug) => ({ lang, slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const { categories, products } = await getCatalog();
  const path = `/products/${slug}`;

  const category = categories.find((c) => c.slug === slug);
  if (category) {
    return pageMetadata({
      locale: lang,
      path,
      title: t(category.meta_title, lang) ?? t(category.name, lang) ?? slug,
      description: t(category.meta_description, lang) ?? t(category.tagline, lang) ?? "",
      absoluteTitle: true,
    });
  }

  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: getDictionary(lang).notFound.title, robots: { index: false } };
  const img = product.images[0];
  return pageMetadata({
    locale: lang,
    path,
    title: t(product.meta_title, lang) ?? t(product.name, lang) ?? slug,
    description: t(product.meta_description, lang) ?? t(product.short, lang) ?? "",
    absoluteTitle: true,
    image: img ? { url: mediaUrl(img.path)!, width: img.width, height: img.height, alt: t(product.name, lang) } : null,
    modifiedTime: product.updated_at,
  });
}

export default async function ProductOrCategoryPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const catalog = await getCatalog();

  const category = catalog.categories.find((c) => c.slug === slug);
  if (category) return <CategoryView category={category} catalog={catalog} locale={lang} dict={d} />;

  const product = catalog.products.find((p) => p.slug === slug);
  if (product) return <ProductView product={product} catalog={catalog} locale={lang} dict={d} />;

  notFound();
}
