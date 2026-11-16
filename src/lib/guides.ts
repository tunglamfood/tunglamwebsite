import type { Locale } from "@/lib/i18n";
import typesOfTofu from "@/content/guides/types-of-tofu";
import eggTofu from "@/content/guides/egg-tofu";
import taufuKeras from "@/content/guides/taufu-keras";
import tauPok from "@/content/guides/tau-pok";
import storeTofu from "@/content/guides/store-tofu";

/**
 * Guides: evergreen, trilingual articles that answer what people search for
 * ("types of tofu", "tau pok", "cara simpan tauhu"…) and link to the products.
 *
 * Content lives in src/content/guides/*.ts (not the admin). Body text is a small
 * Markdown subset rendered by <GuideBody>: `## Heading {#id}`, `### Sub`, paragraphs,
 * `- ` and `1. ` lists, `| tables |`, `> tip`, `**bold**` and `[text](/path)` links
 * (internal paths are written without a locale prefix).
 *
 * Only general food knowledge and facts already on the site. Company facts come
 * from src/lib/site.ts and the product data; never invent them here.
 */
export type GuideText = {
  /** H1. */
  title: string;
  /** ≤ 60 characters including the " | Tung Lam Food" suffix (i.e. ≤ 44 here). */
  metaTitle: string;
  /** 140–160 characters. */
  metaDescription: string;
  /** Intro under the H1, also the card excerpt. */
  lead: string;
  /** "In short" answer box: 3–6 self-contained sentences that answer the query. */
  summary: string[];
  body: string;
  faqs: { q: string; a: string }[];
  /** Image alt text. */
  imageAlt: string;
};

export type Guide = {
  slug: string;
  /** ISO dates (YYYY-MM-DD). Bump `updated` whenever the text changes. */
  published: string;
  updated: string;
  image: { src: string; width: number; height: number };
  /** Product slugs shown in the guide's product grid. */
  products: string[];
  /** Category slugs whose pages (and their products' pages) link back to this guide. */
  categories: string[];
  recipes: string[];
  related: string[];
  /** schema.org `about` topics. */
  about: string[];
  text: Record<Locale, GuideText>;
};

export const GUIDES: Guide[] = [typesOfTofu, eggTofu, taufuKeras, tauPok, storeTofu];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Guides to link from a category page or a product page: its own category first, then its series. */
export function guidesFor(categorySlugs: (string | undefined)[], limit = 3): Guide[] {
  const out: Guide[] = [];
  for (const slug of categorySlugs) {
    if (!slug) continue;
    for (const g of GUIDES) if (g.categories.includes(slug) && !out.includes(g)) out.push(g);
  }
  return out.slice(0, limit);
}
