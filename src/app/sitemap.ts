import type { MetadataRoute } from "next";
import { getCatalog, getRecipes } from "@/lib/data";
import { LOCALES, localePath } from "@/lib/i18n";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";

export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/wholesale", priority: 0.9, changeFrequency: "monthly" },
  { path: "/brands", priority: 0.7, changeFrequency: "monthly" },
  { path: "/recipes", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/careers", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
];

/** One entry per URL per locale, each carrying hreflang alternates and image references. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ categories, products, brands }, recipes] = await Promise.all([getCatalog(), getRecipes()]);

  const pages: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; lastModified?: string; images?: string[] }[] = [
    ...STATIC_PAGES,
    ...categories.map((c) => ({ path: `/products/${c.slug}`, priority: c.parent_id ? 0.8 : 0.85, changeFrequency: "weekly" as const })),
    ...products.map((p) => ({
      path: `/products/${p.slug}`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
      lastModified: p.updated_at,
      images: p.images.map((i) => mediaUrl(i.path)).filter((x): x is string => Boolean(x)),
    })),
    ...brands.map((b) => ({ path: `/brands/${b.slug}`, priority: 0.6, changeFrequency: "monthly" as const })),
    ...recipes.map((r) => ({
      path: `/recipes/${r.slug}`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
      lastModified: r.updated_at,
      images: r.image_path ? [mediaUrl(r.image_path)!] : [],
    })),
  ];

  return pages.flatMap((pg) =>
    LOCALES.map((l) => ({
      url: absoluteUrl(localePath(l, pg.path)),
      lastModified: pg.lastModified ? new Date(pg.lastModified) : undefined,
      changeFrequency: pg.changeFrequency,
      priority: pg.priority,
      alternates: { languages: languageAlternates(pg.path) },
      ...(pg.images?.length ? { images: pg.images } : {}),
    })),
  );
}
