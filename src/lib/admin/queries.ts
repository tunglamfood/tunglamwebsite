import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import type { Brand, Category, Faq, Product, Recipe, SiteFaq } from "@/lib/data";
import { requireAdmin } from "./auth";

/** Admin reads: service role (sees unpublished rows), never cached. Every call re-checks the session. */
async function db() {
  await requireAdmin();
  return adminClient();
}
function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export type AdminProduct = Product & { is_published: boolean; legacy_id: number | null };
export type AdminRecipe = Recipe & { is_published: boolean };
export type Inquiry = {
  id: string;
  kind: "general" | "wholesale" | "product" | "career";
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  product_slug: string | null;
  locale: string | null;
  page_url: string | null;
  status: "new" | "in_progress" | "closed" | "spam";
  created_at: string;
};

export async function adminBrands(): Promise<Brand[]> {
  return must(await (await db()).from("brands").select("*").order("sort"), "brands");
}
export async function adminCategories(): Promise<Category[]> {
  return must(await (await db()).from("categories").select("*").order("sort"), "categories");
}
export async function adminProducts(): Promise<AdminProduct[]> {
  return must(await (await db()).from("products").select("*").order("sort"), "products");
}
export async function adminRecipes(): Promise<AdminRecipe[]> {
  return must(await (await db()).from("recipes").select("*").order("published_at", { ascending: false }), "recipes");
}
export async function adminFaqs(): Promise<SiteFaq[]> {
  return must(await (await db()).from("faqs").select("*").order("sort"), "faqs");
}
export async function adminInquiries(status?: string): Promise<Inquiry[]> {
  let q = (await db()).from("inquiries").select("*").order("created_at", { ascending: false }).limit(500);
  if (status && status !== "all") q = q.eq("status", status);
  return must(await q, "inquiries");
}

async function byId<T>(table: string, id: string): Promise<T | null> {
  if (id === "new") return null;
  const res = await (await db()).from(table).select("*").eq("id", id).maybeSingle();
  return must(res, table) as T | null;
}
export const adminProduct = (id: string) => byId<AdminProduct>("products", id);
export const adminCategory = (id: string) => byId<Category>("categories", id);
export const adminBrand = (id: string) => byId<Brand>("brands", id);
export const adminRecipe = (id: string) => byId<AdminRecipe>("recipes", id);
export const adminFaq = (id: string) => byId<SiteFaq>("faqs", id);

export async function adminCounts() {
  const c = await db();
  const head = { count: "exact" as const, head: true };
  const [products, unpublished, recipes, faqs, newInquiries, inquiries] = await Promise.all([
    c.from("products").select("id", head),
    c.from("products").select("id", head).eq("is_published", false),
    c.from("recipes").select("id", head),
    c.from("faqs").select("id", head),
    c.from("inquiries").select("id", head).eq("status", "new"),
    c.from("inquiries").select("id", head),
  ]);
  return {
    products: products.count ?? 0,
    unpublished: unpublished.count ?? 0,
    recipes: recipes.count ?? 0,
    faqs: faqs.count ?? 0,
    newInquiries: newInquiries.count ?? 0,
    inquiries: inquiries.count ?? 0,
  };
}

export type { Faq };
