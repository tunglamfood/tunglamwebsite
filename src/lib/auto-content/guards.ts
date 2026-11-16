import "server-only";
import type { ContentContext } from "./context";
import type { GuideDraft, RecipeDraft } from "./schemas";

/**
 * Code checks that run on every draft in addition to the AI reviewer.
 * HARD issues block publishing even after a rewrite; SOFT issues are sent back once
 * for a rewrite, and whatever is left is auto-fixed or accepted.
 */
const HARD: { re: RegExp; why: string }[] = [
  { re: /\b(pork|lard|bacon|ham|pancetta|prosciutto|chorizo|salami|pepperoni|lap ?cheong|char ?siu)\b/i, why: "non-halal ingredient" },
  { re: /\b(wine|beer|rum|brandy|whiske?y|vodka|liqueur|mirin|shaoxing|hua ?diao|alcohol|cognac|sherry)\b|\bsake\b(?! of)/i, why: "alcohol" },
  { re: /\b(babi|khinzir|arak|wain|bir)\b/i, why: "non-halal ingredient (ms)" },
  { re: /猪|酒|培根|火腿|腊肠|叉烧/, why: "non-halal ingredient (zh)" },
  { re: /shelf[- ]life|jangka hayat|保质期/i, why: "shelf-life claim" },
  { re: /\bRM\s?\d|\$\s?\d|令吉\s?\d|\d\s?令吉/i, why: "price" },
  { re: /\b(preservative[- ]free|no preservatives?|msg[- ]free|no msg|organic|non[- ]gmo|gluten[- ]free|award[- ]winning|number one|no\.\s?1|iso\s?\d{3,5}|fda[- ]approved)\b/i, why: "unverified product claim" },
  { re: /tanpa pengawet|bebas pengawet|tanpa msg|organik|bebas gluten|nombor satu/i, why: "unverified product claim (ms)" },
  { re: /无防腐剂|不含防腐剂|无味精|有机|非转基因|无麸质|第一品牌/, why: "unverified product claim (zh)" },
  { re: /\b(cures?|curing|heals?|anti-?cancer|detox\w*|weight[- ]loss|lose weight|boosts? (your )?immun\w*|cholesterol|blood sugar|superfood)\b|prevents? (cancer|disease|diabetes)/i, why: "health claim" },
  { re: /menyembuhkan|mencegah (kanser|penyakit)|turun berat badan|kolesterol|gula dalam darah|detoks|antikanser/i, why: "health claim (ms)" },
  { re: /抗癌|治疗|治愈|排毒|减肥|降血糖|胆固醇|超级食物/, why: "health claim (zh)" },
];

const SOFT: { re: RegExp; why: string }[] = [
  { re: /\b(1[89]\d{2}|20\d{2})\b/, why: "mentions a specific year (only 1999, the founding year, is allowed)" },
  { re: /\d\s?%/, why: "uses a percentage/statistic" },
  { re: /<[a-z/][^>]*>/i, why: "contains HTML" },
];

function strings(v: unknown, path = ""): { path: string; text: string }[] {
  if (typeof v === "string") return [{ path, text: v }];
  if (Array.isArray(v)) return v.flatMap((x, i) => strings(x, `${path}[${i}]`));
  if (v && typeof v === "object") return Object.entries(v).flatMap(([k, x]) => strings(x, path ? `${path}.${k}` : k));
  return [];
}

function scan(draft: unknown) {
  const hard: string[] = [];
  const soft: string[] = [];
  for (const { path, text } of strings(draft)) {
    for (const r of HARD) {
      const m = r.re.exec(text.replace(/1999/g, ""));
      if (m) hard.push(`${r.why}: "${m[0]}" in ${path}`);
    }
    for (const r of SOFT) {
      const m = r.re.exec(text.replace(/1999/g, ""));
      if (m) soft.push(`${r.why}: "${m[0]}" in ${path} — remove it`);
    }
  }
  return { hard: [...new Set(hard)], soft: [...new Set(soft)] };
}

const LIMITS = {
  title: { en: 44, ms: 44, zh: 24 },
  desc: { en: [130, 165], ms: [130, 165], zh: [40, 95] },
} as const;

function metaChecks(d: { metaTitle: Record<string, string>; metaDescription: Record<string, string> }) {
  const soft: string[] = [];
  for (const l of ["en", "ms", "zh"] as const) {
    const tl = [...(d.metaTitle[l] ?? "")].length;
    const dl = [...(d.metaDescription[l] ?? "")].length;
    if (tl === 0 || tl > LIMITS.title[l]) soft.push(`metaTitle.${l} is ${tl} characters; it must be 1–${LIMITS.title[l]}`);
    const [lo, hi] = LIMITS.desc[l];
    if (dl < lo || dl > hi) soft.push(`metaDescription.${l} is ${dl} characters; it must be ${lo}–${hi}`);
  }
  return soft;
}

/** Replace links to paths that don't exist (or external links) with their plain text. */
function sanitizeLinks<T>(v: T, allowed: Set<string>): T {
  const fix = (s: string) => s.replace(/\[([^\]]+)\]\(([^)\s]*)\)/g, (all, text: string, href: string) => (allowed.has(href.replace(/\/$/, "")) ? all : text));
  const walk = (x: unknown): unknown =>
    typeof x === "string" ? fix(x) : Array.isArray(x) ? x.map(walk) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, walk(y)])) : x;
  return walk(v) as T;
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

export function uniqueSlug(base: string, taken: Set<string>) {
  const b = slugify(base) || "post";
  let s = b;
  for (let i = 2; taken.has(s); i++) s = `${b}-${i}`;
  return s;
}

/** Cut a meta title to the limit at a word boundary (last resort after a rewrite). */
export function fitMetaTitles(m: Record<"en" | "ms" | "zh", string>) {
  const out = { ...m };
  for (const l of ["en", "ms", "zh"] as const) {
    const max = LIMITS.title[l];
    if ([...out[l]].length <= max) continue;
    if (l === "zh") out[l] = [...out[l]].slice(0, max).join("");
    else out[l] = out[l].slice(0, max + 1).replace(/\s+\S*$/, "").replace(/[\s,:;–—-]+$/, "");
  }
  return out;
}

/** Remove Markdown (**bold**, [links](…)) from fields the site shows as plain text. */
function plain<T>(v: T): T {
  const fix = (s: string) => s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*/g, "");
  const walk = (x: unknown): unknown =>
    typeof x === "string" ? fix(x) : Array.isArray(x) ? x.map(walk) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, y]) => [k, walk(y)])) : x;
  return walk(v) as T;
}

export function checkRecipe(raw: RecipeDraft, ctx: ContentContext) {
  const d: RecipeDraft = plain({ ...raw, productSlugs: raw.productSlugs.filter((s) => ctx.productSlugs.has(s)) });
  const { hard, soft } = scan(d);
  soft.push(...metaChecks(d));
  if (d.productSlugs.length === 0) soft.push("productSlugs must include at least one slug from PRODUCTS");
  if (d.steps.length < 3 || d.steps.length > 12) soft.push(`use 4–9 steps (now ${d.steps.length})`);
  for (const [i, g] of d.ingredientGroups.entries()) {
    const n = g.items.en.length;
    if (g.items.ms.length !== n || g.items.zh.length !== n) soft.push(`ingredientGroups[${i}] has a different number of items in en/ms/zh`);
  }
  if (d.ingredientGroups.reduce((a, g) => a + g.items.en.length, 0) < 3) soft.push("list at least 3 ingredients");
  if (d.prepMinutes < 0 || d.prepMinutes > 240 || d.cookMinutes < 0 || d.cookMinutes > 360) soft.push("prep/cook minutes look wrong");
  if (d.servings < 1 || d.servings > 20) soft.push("servings must be 1–20");
  return { draft: d, hard, soft };
}

export function checkGuide(raw: GuideDraft, ctx: ContentContext) {
  let d: GuideDraft = {
    ...raw,
    productSlugs: raw.productSlugs.filter((s) => ctx.productSlugs.has(s)),
    categorySlugs: raw.categorySlugs.filter((s) => ctx.categorySlugs.has(s)),
    recipeSlugs: raw.recipeSlugs.map((s) => s.replace(/^\/?recipes\//, "")).filter((s) => ctx.recipeSlugs.has(s)),
    relatedGuideSlugs: raw.relatedGuideSlugs.map((s) => s.replace(/^\/?guides\//, "")).filter((s) => ctx.guideSlugs.has(s)),
  };
  d = sanitizeLinks(d, ctx.links);
  // Only body and summary are rendered as Markdown; everything else is plain text.
  d = { ...d, ...plain({ title: d.title, metaTitle: d.metaTitle, metaDescription: d.metaDescription, lead: d.lead, imageAlt: d.imageAlt, faqs: d.faqs }) };
  const { hard, soft } = scan(d);
  soft.push(...metaChecks(d));
  const ids = (["en", "ms", "zh"] as const).map((l) => [...d.body[l].matchAll(/^## .+?\{#([\w-]+)\}\s*$/gm)].map((m) => m[1]).join(","));
  const h2count = (["en", "ms", "zh"] as const).map((l) => (d.body[l].match(/^## /gm) ?? []).length);
  if (new Set(ids).size !== 1 || ids[0].split(",").length !== h2count[0]) soft.push("every '## Heading {#id}' must have an id, and the ids must be identical and in the same order in en, ms and zh");
  if (h2count[0] < 4) soft.push("body needs 4–7 '## ' sections");
  if (d.body.en.split(/\s+/).length < 450) soft.push("body.en is too short; write 700–1100 words");
  if (!/\]\(\/products\//.test(d.body.en)) soft.push("body must link to at least one /products/… page from ALLOWED LINKS");
  for (const l of ["en", "ms", "zh"] as const) if (d.summary[l].length < 3 || d.summary[l].length > 6) soft.push(`summary.${l} needs 3–5 sentences`);
  if (d.faqs.length < 3 || d.faqs.length > 6) soft.push("write 4–5 FAQs");
  if (d.productSlugs.length === 0) soft.push("productSlugs must include slugs from PRODUCTS");
  return { draft: d, hard, soft };
}
