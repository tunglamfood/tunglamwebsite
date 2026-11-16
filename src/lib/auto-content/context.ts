import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { SITE, fullAddress } from "@/lib/site";
import type { L10n } from "@/lib/i18n";

/**
 * Everything the writer may know: verified company facts (src/lib/site.ts), the live
 * product list, and what already exists (so topics don't repeat). Read fresh with the
 * service role on every run — never from the page cache.
 */
export type ContentContext = {
  facts: string;
  productSlugs: Set<string>;
  categorySlugs: Set<string>;
  recipeSlugs: Set<string>;
  guideSlugs: Set<string>;
  /** Locale-agnostic internal paths the writer may link to. */
  links: Set<string>;
  linkList: string;
  existingTitles: string[];
  usedKeywords: Set<string>;
};

type Row = { slug: string; name?: L10n; title?: L10n; short?: L10n; net_weight?: string | null; brand_id?: string | null; category_id?: string | null; parent_id?: string | null; id?: string };

export async function loadContext(): Promise<ContentContext> {
  const db = adminClient();
  const [products, categories, brands, recipes, guides, posts] = await Promise.all([
    db.from("products").select("slug,name,short,net_weight,brand_id,category_id").eq("is_published", true).order("sort"),
    db.from("categories").select("id,slug,name,parent_id").order("sort"),
    db.from("brands").select("id,name"),
    db.from("recipes").select("slug,title"),
    db.from("guides").select("slug,title"),
    db.from("auto_posts").select("keyword,topic,status"),
  ]);
  for (const r of [products, categories, brands, recipes, guides, posts]) if (r.error) throw new Error(r.error.message);

  const brandName = new Map((brands.data ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const cats = (categories.data ?? []) as Row[];
  const catById = new Map(cats.map((c) => [c.id, c]));

  const productLines = ((products.data ?? []) as Row[]).map((p) => {
    const cat = p.category_id ? catById.get(p.category_id) : undefined;
    return `- ${p.slug} | ${p.name?.en} | ${p.name?.ms ?? ""} | ${p.name?.zh ?? ""} | ${p.net_weight ?? ""} | brand ${p.brand_id ? brandName.get(p.brand_id) : "-"} | category ${cat?.slug ?? "-"} | ${p.short?.en ?? ""}`;
  });

  const facts = [
    "COMPANY FACTS — the ONLY facts about the company you may state:",
    `- ${SITE.legalName} ("Tung Lam Food", Chinese name 东临食品), a chilled and frozen food manufacturer in ${SITE.address.locality}, ${SITE.address.region}, Malaysia, established ${SITE.foundingYear}.`,
    `- Certifications: ${SITE.certifications.join(", ")} (the company is a Halal-certified manufacturer).`,
    "- Brands: " + [...new Set(brandName.values())].join(", ") + ".",
    "- Supplies households (through retailers and wet markets), hawkers, restaurants, caterers and distributors in Malaysia. Wholesale enquiries: the /wholesale page or WhatsApp.",
    `- Contact: WhatsApp ${SITE.phoneDisplay}, email ${SITE.email}, address ${fullAddress}.`,
    "- Storage of its products: keep chilled or frozen as indicated on each pack, use by the date printed on the pack.",
    "",
    "PRODUCT LINES (category slug | name EN | name ZH):",
    ...cats.map((c) => `- ${c.slug} | ${c.name?.en} | ${c.name?.zh ?? ""}${c.parent_id ? "" : " (series)"}`),
    "",
    "PRODUCTS (slug | name EN | name MS | name ZH | size | brand | category | description):",
    ...productLines,
  ].join("\n");

  const productSlugs = new Set(((products.data ?? []) as Row[]).map((p) => p.slug));
  const categorySlugs = new Set(cats.map((c) => c.slug));
  const recipeRows = (recipes.data ?? []) as Row[];
  const guideRows = (guides.data ?? []) as Row[];
  const recipeSlugs = new Set(recipeRows.map((r) => r.slug));
  const guideSlugs = new Set(guideRows.map((g) => g.slug));

  const linkEntries: [string, string][] = [
    ["/products", "All products"],
    ["/wholesale", "Wholesale & food service enquiries"],
    ["/recipes", "All recipes"],
    ["/guides", "All guides"],
    ...cats.map((c) => [`/products/${c.slug}`, `Product line: ${c.name?.en}`] as [string, string]),
    ...((products.data ?? []) as Row[]).map((p) => [`/products/${p.slug}`, `Product: ${p.name?.en}`] as [string, string]),
    ...recipeRows.map((r) => [`/recipes/${r.slug}`, `Recipe: ${r.title?.en}`] as [string, string]),
    ...guideRows.map((g) => [`/guides/${g.slug}`, `Guide: ${g.title?.en}`] as [string, string]),
  ];

  const plannedTitles = ((posts.data ?? []) as { topic: { title?: string }; status: string }[])
    .filter((p) => p.status !== "failed")
    .map((p) => p.topic?.title)
    .filter((x): x is string => Boolean(x));

  return {
    facts,
    productSlugs,
    categorySlugs,
    recipeSlugs,
    guideSlugs,
    links: new Set(linkEntries.map(([p]) => p)),
    linkList: linkEntries.map(([p, label]) => `- ${p} — ${label}`).join("\n"),
    existingTitles: [
      ...recipeRows.map((r) => `Recipe: ${r.title?.en}`),
      ...guideRows.map((g) => `Guide: ${g.title?.en}`),
      ...plannedTitles.map((t) => `Planned: ${t}`),
    ],
    usedKeywords: new Set(((posts.data ?? []) as { keyword: string }[]).map((p) => p.keyword)),
  };
}
