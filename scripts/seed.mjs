#!/usr/bin/env node
/**
 * Seed Supabase from supabase/seed/** and regenerate src/data/legacy-redirects.json.
 * Idempotent: upserts by slug, re-uploads media with upsert.
 *
 *   node --env-file=.env scripts/seed.mjs            # everything
 *   node --env-file=.env scripts/seed.mjs --no-media # skip storage upload
 *
 * ⚠ Content is now managed in the admin panel (/admin). Re-seeding OVERWRITES admin edits
 *   (products/categories/brands/recipes by slug) and REPLACES all FAQs, so it refuses to run
 *   against a database that already has products unless you pass --force.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const SEED = join(ROOT, "supabase/seed");
const skipMedia = process.argv.includes("--no-media");
const force = process.argv.includes("--force");

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const json = async (f) => JSON.parse(await readFile(join(SEED, "data", f), "utf8"));
const ok = (res, what) => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
};

// ---------------------------------------------------------------- legacy maps
/** Old NEWPAGES category ids -> new category slug. */
const LEGACY_CATEGORY = {
  476076: "tofu-series", 476096: "dessert-series", 476100: "steamboat-series",
  476077: "egg-tofu", 476078: "egg-tofu", 476079: "egg-tofu", 477586: "egg-tofu", 477588: "egg-tofu",
  476090: "silken-tofu-box", 476091: "silken-tofu-box", 476116: "silken-tofu-box",
  476117: "silken-tofu-tube", 476118: "silken-tofu-tube", 477584: "silken-tofu-tube",
  476124: "tofu-puffs", 476125: "tofu-puffs",
  477592: "firm-tofu", 477593: "firm-tofu",
  476097: "cincau-grass-jelly", 476098: "cincau-grass-jelly", 477605: "cendol",
  476101: "retail-wet-market-pack", 476102: "retail-wet-market-pack", 476103: "retail-wet-market-pack",
  477597: "food-service-pack", 477603: "peeled-quail-eggs", 477604: "fish-paste",
};

// ---------------------------------------------------------------- media
async function uploadDir(sub) {
  const dir = join(SEED, "media", sub);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".webp"));
  for (const f of files) {
    const body = await readFile(join(dir, f));
    ok(
      await sb.storage.from("media").upload(`${sub}/${f}`, body, { contentType: "image/webp", upsert: true, cacheControl: "31536000" }),
      `upload ${sub}/${f}`,
    );
  }
  console.log(`uploaded ${files.length} files to media/${sub}`);
}

// ---------------------------------------------------------------- main
const [base, content, taxonomy, recipesBase, recipes, faqs] = await Promise.all([
  json("products.base.json"),
  json("products.content.json"),
  json("taxonomy.content.json"),
  json("recipes.base.json"),
  json("recipes.content.json"),
  json("faqs.content.json"),
]);

{
  const { count } = await sb.from("products").select("id", { count: "exact", head: true });
  if (count && !force) {
    throw new Error(`Database already has ${count} products. Seeding would overwrite edits made in /admin.
Re-run with --force if you really want to reset content from supabase/seed/.`);
  }
}

if (!skipMedia) {
  await uploadDir("products");
  await uploadDir("recipes");
}

// Brands
const brandRows = taxonomy.brands.map((b, i) => ({
  slug: b.slug,
  name: b.name,
  tagline: b.tagline,
  description: b.description,
  meta_title: b.meta_title,
  meta_description: b.meta_description,
  sort: i,
}));
const brands = ok(await sb.from("brands").upsert(brandRows, { onConflict: "slug" }).select("id,slug"), "brands");
const brandId = Object.fromEntries(brands.map((b) => [b.slug, b.id]));
console.log(`brands: ${brands.length}`);

// Categories — parents first so children can reference them.
const legacyIdsFor = (slug) => Object.entries(LEGACY_CATEGORY).filter(([, s]) => s === slug).map(([id]) => Number(id));
const catRow = (c, i, parentId = null) => ({
  slug: c.slug,
  parent_id: parentId,
  name: c.name,
  tagline: c.tagline ?? {},
  intro: c.intro ?? {},
  faqs: c.faqs ?? [],
  meta_title: c.meta_title ?? {},
  meta_description: c.meta_description ?? {},
  legacy_ids: legacyIdsFor(c.slug),
  sort: i,
});
const parents = taxonomy.categories.filter((c) => !c.parent);
const parentsSaved = ok(
  await sb.from("categories").upsert(parents.map((c) => catRow(c, taxonomy.categories.indexOf(c))), { onConflict: "slug" }).select("id,slug"),
  "series",
);
const catId = Object.fromEntries(parentsSaved.map((c) => [c.slug, c.id]));
const children = taxonomy.categories.filter((c) => c.parent);
const childrenSaved = ok(
  await sb
    .from("categories")
    .upsert(children.map((c) => catRow(c, taxonomy.categories.indexOf(c), catId[c.parent])), { onConflict: "slug" })
    .select("id,slug"),
  "categories",
);
for (const c of childrenSaved) catId[c.slug] = c.id;
console.log(`categories: ${parentsSaved.length + childrenSaved.length}`);

// Products
const productRows = base.map((p) => {
  const c = content[p.slug];
  if (!c) throw new Error(`missing content for ${p.slug}`);
  return {
    slug: p.slug,
    name: c.name,
    short: c.short,
    description: c.description,
    highlights: c.highlights,
    serving_ideas: c.serving_ideas,
    brand_id: brandId[p.brand],
    category_id: catId[p.category],
    net_weight: p.net_weight,
    images: [{ path: p.image, width: p.image_size[0], height: p.image_size[1] }],
    is_featured: p.featured,
    is_published: true,
    meta_title: c.meta_title,
    meta_description: c.meta_description,
    legacy_id: p.legacy_id,
    legacy_slug: p.legacy_slug,
    sort: p.sort,
  };
});
ok(await sb.from("products").upsert(productRows, { onConflict: "slug" }), "products");
console.log(`products: ${productRows.length}`);

// Recipes (content file is in the same order as the base file)
const recipeRows = recipes.map((r) => {
  const b = recipesBase.find((x) => x.legacy_id === r.legacy_id);
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    intro: r.intro,
    image_path: b?.image ?? null,
    image_width: b?.image_size?.[0] ?? null,
    image_height: b?.image_size?.[1] ?? null,
    prep_minutes: r.prep_minutes,
    cook_minutes: r.cook_minutes,
    servings: r.servings,
    difficulty: r.difficulty,
    cuisine: r.cuisine,
    course: r.course,
    ingredients: r.ingredients,
    steps: r.steps,
    tips: r.tips,
    keywords: r.keywords,
    product_slugs: r.products,
    published_at: r.published_at,
    meta_title: r.meta_title,
    meta_description: r.meta_description,
    legacy_id: r.legacy_id,
  };
});
// Recipe images were saved under the base slug; keep the path as-is.
ok(await sb.from("recipes").upsert(recipeRows, { onConflict: "slug" }), "recipes");
console.log(`recipes: ${recipeRows.length}`);

// FAQs — replace all
ok(await sb.from("faqs").delete().neq("id", "00000000-0000-0000-0000-000000000000"), "faqs delete");
ok(await sb.from("faqs").insert(faqs.map((f, i) => ({ grp: f.group, question: f.q, answer: f.a, sort: i }))), "faqs");
console.log(`faqs: ${faqs.length}`);

// ---------------------------------------------------------------- legacy redirects
const redirects = [
  ...base.map((p) => ({ source: `/showproducts/productid/${p.legacy_id}/:rest*`, destination: `/products/${p.slug}` })),
  ...Object.entries(LEGACY_CATEGORY).map(([id, slug]) => ({ source: `/ourproducts/cid/${id}/:rest*`, destination: `/products/${slug}` })),
  ...recipes.map((r) => ({ source: `/latestnews/nid/${r.legacy_id}/:rest*`, destination: `/recipes/${r.slug}` })),
  { source: "/brand/bid/6895/:rest*", destination: "/brands/tung-lam" },
  { source: "/brand/bid/:rest*", destination: "/brands" },
  { source: "/showproducts/:rest*", destination: "/products" },
  { source: "/ourproducts/:rest*", destination: "/products" },
  { source: "/category/:rest*", destination: "/products" },
  { source: "/tag/:rest*", destination: "/products" },
  { source: "/latestnews/:rest*", destination: "/recipes" },
  { source: "/pages/pages_id/21827/:rest*", destination: "/about" },
  { source: "/contactus/:rest*", destination: "/contact" },
  { source: "/career/:rest*", destination: "/careers" },
  { source: "/en/sitemap/:rest*", destination: "/" },
];
await writeFile(join(ROOT, "src/data/legacy-redirects.json"), JSON.stringify(redirects, null, 1) + "\n");
console.log(`legacy redirects: ${redirects.length}`);
