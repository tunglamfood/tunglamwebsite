import "server-only";
import { cache } from "react";
import { contentClient } from "@/lib/supabase/server";
import type { L10n, Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Types (mirror supabase/migrations/*_init.sql)
// ---------------------------------------------------------------------------
export type Faq = { q: L10n; a: L10n };

export type Brand = {
  id: string;
  slug: string;
  name: string;
  tagline: L10n;
  description: L10n;
  logo_path: string | null;
  meta_title: L10n;
  meta_description: L10n;
  sort: number;
};

export type Category = {
  id: string;
  slug: string;
  parent_id: string | null;
  name: L10n;
  tagline: L10n;
  intro: L10n;
  faqs: Faq[];
  image_path: string | null;
  meta_title: L10n;
  meta_description: L10n;
  sort: number;
};

export type ProductImage = { path: string; width: number; height: number };

export type Product = {
  id: string;
  slug: string;
  name: L10n;
  short: L10n;
  description: L10n;
  highlights: L10n<string[]>;
  serving_ideas: L10n<string[]>;
  brand_id: string | null;
  category_id: string | null;
  net_weight: string | null;
  images: ProductImage[];
  is_featured: boolean;
  meta_title: L10n;
  meta_description: L10n;
  sort: number;
  updated_at: string;
};

export type RecipeIngredientGroup = { group: L10n | null; items: L10n<string[]> };
export type RecipeStep = { title: L10n | null; text: L10n };

export type Recipe = {
  id: string;
  slug: string;
  title: L10n;
  excerpt: L10n;
  intro: L10n;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  servings: number | null;
  difficulty: string | null;
  cuisine: L10n;
  course: L10n;
  ingredients: RecipeIngredientGroup[];
  steps: RecipeStep[];
  tips: L10n<string[]>;
  keywords: L10n<string[]>;
  product_slugs: string[];
  published_at: string;
  updated_at: string;
  meta_title: L10n;
  meta_description: L10n;
};

export type SiteFaq = { id: string; grp: string; question: L10n; answer: L10n; sort: number };

// ---------------------------------------------------------------------------
// Queries — the catalog is small, so we load whole tables once per request
// (deduped by React cache, persisted by the fetch cache) and filter in memory.
// ---------------------------------------------------------------------------
function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Failed to load ${what}: ${res.error.message}`);
  return res.data as T;
}

export const getBrands = cache(async (): Promise<Brand[]> =>
  must(await contentClient().from("brands").select("*").order("sort"), "brands"),
);

export const getCategories = cache(async (): Promise<Category[]> =>
  must(await contentClient().from("categories").select("*").order("sort"), "categories"),
);

export const getProducts = cache(async (): Promise<Product[]> =>
  must(
    await contentClient()
      .from("products")
      .select("id,slug,name,short,description,highlights,serving_ideas,brand_id,category_id,net_weight,images,is_featured,meta_title,meta_description,sort,updated_at")
      .eq("is_published", true)
      .order("sort"),
    "products",
  ),
);

export const getRecipes = cache(async (): Promise<Recipe[]> =>
  must(
    await contentClient().from("recipes").select("*").eq("is_published", true).order("published_at", { ascending: false }),
    "recipes",
  ),
);

export const getSiteFaqs = cache(async (): Promise<SiteFaq[]> =>
  must(await contentClient().from("faqs").select("id,grp,question,answer,sort").order("sort"), "faqs"),
);

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------
export type Catalog = Awaited<ReturnType<typeof getCatalog>>;

export const getCatalog = cache(async () => {
  const [brands, categories, products] = await Promise.all([getBrands(), getCategories(), getProducts()]);
  const brandById = new Map(brands.map((b) => [b.id, b]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const series = categories.filter((c) => !c.parent_id);
  const linesOf = (seriesId: string) => categories.filter((c) => c.parent_id === seriesId);
  const seriesOf = (cat: Category | undefined) => (cat?.parent_id ? categoryById.get(cat.parent_id) : cat);

  /** All products inside a category (a series includes its product lines). */
  const productsIn = (cat: Category) => {
    const ids = new Set([cat.id, ...linesOf(cat.id).map((c) => c.id)]);
    return products.filter((p) => p.category_id && ids.has(p.category_id));
  };

  return { brands, categories, products, brandById, categoryById, series, linesOf, seriesOf, productsIn };
});

export function productName(p: Product, locale: Locale) {
  return t(p.name, locale) ?? p.slug;
}
