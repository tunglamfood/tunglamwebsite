"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { CONTENT_TAG } from "@/lib/supabase/server";
import { requireAdmin } from "./auth";
import { ADMIN_COOKIE, SESSION_TTL_SECONDS, checkPassword, createSessionToken } from "./session";

export type ActionResult = { ok: true; id?: string; message?: string } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_prev: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return { error: "Too many attempts. Please wait a few minutes and try again." };

  const ok = await checkPassword(String(formData.get("password") ?? ""));
  if (!ok) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "Incorrect password." };
  }
  attempts.delete(ip);

  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const slug = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and single hyphens");

const l10n = z.object({ en: z.string().optional(), ms: z.string().optional(), zh: z.string().optional() }).partial();
const l10nList = z.object({ en: z.array(z.string()).optional(), ms: z.array(z.string()).optional(), zh: z.array(z.string()).optional() }).partial();

type L = z.infer<typeof l10n>;
type LL = z.infer<typeof l10nList>;

/** Trim and drop empty languages so the site falls back to English instead of showing blanks. */
function cleanL(v: L | null | undefined): L {
  const out: L = {};
  for (const k of ["en", "ms", "zh"] as const) {
    const s = v?.[k]?.trim();
    if (s) out[k] = s;
  }
  return out;
}
function cleanLL(v: LL | null | undefined): LL {
  const out: LL = {};
  for (const k of ["en", "ms", "zh"] as const) {
    const arr = (v?.[k] ?? []).map((s) => s.trim()).filter(Boolean);
    if (arr.length) out[k] = arr;
  }
  return out;
}
const requireEn = (v: L, field: string) => {
  if (!v.en) throw new Error(`${field} (English) is required`);
  return v;
};

function fail(e: unknown): ActionResult {
  const msg = e instanceof z.ZodError ? e.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join("; ") : e instanceof Error ? e.message : String(e);
  if (/duplicate key|unique/i.test(msg)) return { ok: false, error: "That slug is already in use. Choose another." };
  return { ok: false, error: msg };
}

function publish() {
  // Expire all cached public content so the website shows the change on the next request.
  updateTag(CONTENT_TAG);
}

async function slugTakenByOther(table: "products" | "categories", value: string) {
  const other = table === "products" ? "categories" : "products";
  const { data } = await adminClient().from(other).select("id").eq("slug", value).maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const imageSchema = z.object({ path: z.string().min(1), width: z.number().int().positive(), height: z.number().int().positive() });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: l10n,
  short: l10n,
  description: l10n,
  highlights: l10nList,
  serving_ideas: l10nList,
  brand_id: z.string().uuid().nullable(),
  category_id: z.string().uuid().nullable(),
  net_weight: z.string().trim().max(60).nullable(),
  images: z.array(imageSchema).max(12),
  is_featured: z.boolean(),
  is_published: z.boolean(),
  meta_title: l10n,
  meta_description: l10n,
  sort: z.number().int(),
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    const v = productSchema.parse(input);
    if (await slugTakenByOther("products", v.slug)) throw new Error("A category already uses this slug.");
    const row = {
      slug: v.slug,
      name: requireEn(cleanL(v.name), "Name"),
      short: cleanL(v.short),
      description: cleanL(v.description),
      highlights: cleanLL(v.highlights),
      serving_ideas: cleanLL(v.serving_ideas),
      brand_id: v.brand_id,
      category_id: v.category_id,
      net_weight: v.net_weight || null,
      images: v.images,
      is_featured: v.is_featured,
      is_published: v.is_published,
      meta_title: cleanL(v.meta_title),
      meta_description: cleanL(v.meta_description),
      sort: v.sort,
    };
    const db = adminClient();
    const res = v.id
      ? await db.from("products").update(row).eq("id", v.id).select("id").single()
      : await db.from("products").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    publish();
    return { ok: true, id: res.data.id, message: "Product saved and published to the website." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await adminClient().from("products").delete().eq("id", id);
  if (error) return fail(error.message);
  publish();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const faqItem = z.object({ q: l10n, a: l10n });
const categorySchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  parent_id: z.string().uuid().nullable(),
  name: l10n,
  tagline: l10n,
  intro: l10n,
  faqs: z.array(faqItem).max(20),
  image_path: z.string().nullable(),
  meta_title: l10n,
  meta_description: l10n,
  sort: z.number().int(),
});
export type CategoryInput = z.input<typeof categorySchema>;

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    const v = categorySchema.parse(input);
    if (v.id && v.parent_id === v.id) throw new Error("A category can't be its own parent.");
    if (await slugTakenByOther("categories", v.slug)) throw new Error("A product already uses this slug.");
    const row = {
      slug: v.slug,
      parent_id: v.parent_id,
      name: requireEn(cleanL(v.name), "Name"),
      tagline: cleanL(v.tagline),
      intro: cleanL(v.intro),
      faqs: v.faqs.map((f) => ({ q: cleanL(f.q), a: cleanL(f.a) })).filter((f) => f.q.en && f.a.en),
      image_path: v.image_path,
      meta_title: cleanL(v.meta_title),
      meta_description: cleanL(v.meta_description),
      sort: v.sort,
    };
    const db = adminClient();
    const res = v.id
      ? await db.from("categories").update(row).eq("id", v.id).select("id").single()
      : await db.from("categories").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    publish();
    return { ok: true, id: res.data.id, message: "Category saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = adminClient();
  const [{ count: products }, { count: children }] = await Promise.all([
    db.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    db.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", id),
  ]);
  if (products || children) return { ok: false, error: "Move or delete the products and sub-categories in this category first." };
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return fail(error.message);
  publish();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------
const brandSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  name: z.string().trim().min(1).max(80),
  tagline: l10n,
  description: l10n,
  logo_path: z.string().nullable(),
  meta_title: l10n,
  meta_description: l10n,
  sort: z.number().int(),
});
export type BrandInput = z.input<typeof brandSchema>;

export async function saveBrand(input: BrandInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    const v = brandSchema.parse(input);
    const row = {
      slug: v.slug,
      name: v.name,
      tagline: cleanL(v.tagline),
      description: cleanL(v.description),
      logo_path: v.logo_path,
      meta_title: cleanL(v.meta_title),
      meta_description: cleanL(v.meta_description),
      sort: v.sort,
    };
    const db = adminClient();
    const res = v.id
      ? await db.from("brands").update(row).eq("id", v.id).select("id").single()
      : await db.from("brands").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    publish();
    return { ok: true, id: res.data.id, message: "Brand saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = adminClient();
  const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id);
  if (count) return { ok: false, error: `${count} product(s) still use this brand. Reassign them first.` };
  const { error } = await db.from("brands").delete().eq("id", id);
  if (error) return fail(error.message);
  publish();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Recipes / articles
// ---------------------------------------------------------------------------
const recipeSchema = z.object({
  id: z.string().uuid().optional(),
  slug,
  title: l10n,
  excerpt: l10n,
  intro: l10n,
  image_path: z.string().nullable(),
  image_width: z.number().int().nullable(),
  image_height: z.number().int().nullable(),
  prep_minutes: z.number().int().min(0).nullable(),
  cook_minutes: z.number().int().min(0).nullable(),
  servings: z.number().int().min(0).nullable(),
  difficulty: z.enum(["easy", "medium"]).nullable(),
  cuisine: l10n,
  course: l10n,
  ingredients: z.array(z.object({ group: l10n.nullable(), items: l10nList })).max(30),
  steps: z.array(z.object({ title: l10n.nullable(), text: l10n })).max(60),
  tips: l10nList,
  keywords: l10nList,
  product_slugs: z.array(z.string()).max(12),
  is_published: z.boolean(),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  meta_title: l10n,
  meta_description: l10n,
});
export type RecipeInput = z.input<typeof recipeSchema>;

export async function saveRecipe(input: RecipeInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    const v = recipeSchema.parse(input);
    const group = (g: L | null) => {
      const c = cleanL(g);
      return c.en ? c : null;
    };
    const row = {
      slug: v.slug,
      title: requireEn(cleanL(v.title), "Title"),
      excerpt: cleanL(v.excerpt),
      intro: cleanL(v.intro),
      image_path: v.image_path,
      image_width: v.image_width,
      image_height: v.image_height,
      prep_minutes: v.prep_minutes,
      cook_minutes: v.cook_minutes,
      servings: v.servings,
      difficulty: v.difficulty,
      cuisine: cleanL(v.cuisine),
      course: cleanL(v.course),
      ingredients: v.ingredients.map((g) => ({ group: group(g.group), items: cleanLL(g.items) })).filter((g) => g.items.en?.length),
      steps: v.steps.map((s) => ({ title: group(s.title), text: cleanL(s.text) })).filter((s) => s.text.en),
      tips: cleanLL(v.tips),
      keywords: cleanLL(v.keywords),
      product_slugs: v.product_slugs,
      is_published: v.is_published,
      published_at: v.published_at,
      meta_title: cleanL(v.meta_title),
      meta_description: cleanL(v.meta_description),
    };
    const db = adminClient();
    const res = v.id
      ? await db.from("recipes").update(row).eq("id", v.id).select("id").single()
      : await db.from("recipes").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    publish();
    return { ok: true, id: res.data.id, message: "Saved and published to the website." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await adminClient().from("recipes").delete().eq("id", id);
  if (error) return fail(error.message);
  publish();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------
const faqSchema = z.object({
  id: z.string().uuid().optional(),
  grp: z.enum(["products", "ordering", "company"]),
  question: l10n,
  answer: l10n,
  sort: z.number().int(),
});
export type FaqInput = z.input<typeof faqSchema>;

export async function saveFaq(input: FaqInput): Promise<ActionResult> {
  await requireAdmin();
  try {
    const v = faqSchema.parse(input);
    const row = { grp: v.grp, question: requireEn(cleanL(v.question), "Question"), answer: requireEn(cleanL(v.answer), "Answer"), sort: v.sort };
    const db = adminClient();
    const res = v.id
      ? await db.from("faqs").update(row).eq("id", v.id).select("id").single()
      : await db.from("faqs").insert(row).select("id").single();
    if (res.error) throw new Error(res.error.message);
    publish();
    return { ok: true, id: res.data.id, message: "FAQ saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await adminClient().from("faqs").delete().eq("id", id);
  if (error) return fail(error.message);
  publish();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------
export async function setInquiryStatus(id: string, status: "new" | "in_progress" | "closed" | "spam"): Promise<ActionResult> {
  await requireAdmin();
  if (!["new", "in_progress", "closed", "spam"].includes(status)) return { ok: false, error: "Invalid status" };
  const { error } = await adminClient().from("inquiries").update({ status }).eq("id", id);
  return error ? fail(error.message) : { ok: true };
}

export async function deleteInquiry(id: string): Promise<ActionResult> {
  await requireAdmin();
  const { error } = await adminClient().from("inquiries").delete().eq("id", id);
  return error ? fail(error.message) : { ok: true };
}

// ---------------------------------------------------------------------------
// Media upload (images are resized + converted to WebP in the browser first)
// ---------------------------------------------------------------------------
const FOLDERS = ["products", "recipes", "brands", "categories"] as const;

export async function uploadImage(formData: FormData): Promise<ActionResult & { path?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  const folder = String(formData.get("folder"));
  const name = String(formData.get("name") ?? "image")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "image";
  if (!(file instanceof File)) return { ok: false, error: "No file received" };
  if (!FOLDERS.includes(folder as (typeof FOLDERS)[number])) return { ok: false, error: "Invalid folder" };
  if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) return { ok: false, error: "Only WebP, JPEG or PNG images" };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Image is larger than 4 MB" };

  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${folder}/${name}-${Date.now().toString(36)}.${ext}`;
  const { error } = await adminClient()
    .storage.from("media")
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return fail(error.message);
  return { ok: true, path };
}

/** Manually expire the website cache (e.g. after editing data directly in Supabase). */
export async function refreshWebsite(): Promise<ActionResult> {
  await requireAdmin();
  publish();
  return { ok: true, message: "Website refreshed." };
}
