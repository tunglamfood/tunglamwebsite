/** Static brand logo assets in /public/brand, keyed by brand slug. */
export const BRAND_LOGOS: Record<string, { src: string; w: number; h: number }> = {
  "tung-lam": { src: "/brand/brand-tunglam.webp", w: 600, h: 350 },
  sakura: { src: "/brand/brand-sakura.webp", w: 500, h: 500 },
  cili: { src: "/brand/brand-cili.webp", w: 500, h: 500 },
  ad: { src: "/brand/brand-ad.webp", w: 885, h: 413 },
};

/** Lifestyle imagery per product series, in /public/images. */
export const SERIES_IMAGES: Record<string, string> = {
  "tofu-series": "/images/series-tofu.webp",
  "steamboat-series": "/images/series-steamboat.webp",
  "dessert-series": "/images/series-dessert.webp",
};
