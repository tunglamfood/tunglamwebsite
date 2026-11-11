import { mediaUrl } from "@/lib/media";

/** Built-in brand logos in /public/brand, keyed by brand slug (used when no logo is uploaded in the admin). */
export const BRAND_LOGOS: Record<string, { src: string; w: number; h: number }> = {
  "tung-lam": { src: "/brand/brand-tunglam.webp", w: 600, h: 350 },
  sakura: { src: "/brand/brand-sakura.webp", w: 500, h: 500 },
  cili: { src: "/brand/brand-cili.webp", w: 500, h: 500 },
  ad: { src: "/brand/brand-ad.webp", w: 885, h: 413 },
};

/** Built-in lifestyle imagery per product series, in /public/images. */
export const SERIES_IMAGES: Record<string, string> = {
  "tofu-series": "/images/series-tofu.webp",
  "steamboat-series": "/images/series-steamboat.webp",
  "dessert-series": "/images/series-dessert.webp",
};

/** Uploaded logo (admin) → built-in logo → none. */
export function brandLogoSrc(brand: { slug: string; logo_path: string | null }): string | null {
  return mediaUrl(brand.logo_path) ?? BRAND_LOGOS[brand.slug]?.src ?? null;
}

/** Uploaded cover (admin) → built-in series image → hero. */
export function seriesImageSrc(category: { slug: string; image_path: string | null }): string {
  return mediaUrl(category.image_path) ?? SERIES_IMAGES[category.slug] ?? "/images/hero.webp";
}
