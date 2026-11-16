import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import sharp from "sharp";
import { revalidateTag } from "next/cache";
import { adminClient } from "@/lib/supabase/admin";
import { CONTENT_TAG } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { allLanguageUrls, submitToIndexNow } from "@/lib/indexnow";
import { loadContext, type ContentContext } from "./context";
import { REVIEW_MODEL, WRITER_MODEL, structured } from "./openai";
import { COURSES, guideSchema, recipeSchema, reviewSchema, topicPlanSchema, type GuideDraft, type LAll, type RecipeDraft, type Review, type TopicPlan } from "./schemas";
import { guideWriterPrompt, plannerPrompt, recipeWriterPrompt, reviewerPrompt } from "./prompts";
import { checkGuide, checkRecipe, fitMetaTitles, uniqueSlug } from "./guards";
import { createImageTask, getImageTask } from "./kie";
import { POST_THRESHOLD, TOPIC_THRESHOLD, canonical, judgeDuplicates, similarTo } from "./dedupe";

/**
 * Auto content: plans topics, writes a trilingual recipe or guide with OpenAI, checks it
 * (code guards + an AI reviewer, one rewrite), generates the photo with Kie, then publishes.
 *
 *   cron (3×/day) → runAutoPost(kind) → status "imaging" ─┐
 *   Kie callback / next run's sweep → finishImage(id) ────┴→ row in recipes/guides, status "published"
 */
export type Kind = "recipe" | "guide";
export type Topic = { title: string; angle: string; keywords: LAll; productSlugs: string[] };
export type AutoPost = {
  id: string;
  kind: Kind;
  keyword: string;
  topic: Topic;
  status: "planned" | "writing" | "imaging" | "publishing" | "published" | "rejected" | "failed";
  content: Record<string, unknown> | null;
  review: unknown;
  kie_task_id: string | null;
  slug: string | null;
  attempts: number;
  error: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type RunResult = { ok: boolean; message: string; id?: string; ms?: number };

const MAX_ATTEMPTS = 3;
const db = () => adminClient();
const todayMY = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getAutoSettings(): Promise<{ enabled: boolean; slots: Kind[] }> {
  const { data, error } = await db().from("auto_settings").select("enabled,slots").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return { enabled: data?.enabled ?? false, slots: ((data?.slots ?? ["recipe", "recipe", "guide"]) as string[]).filter((s): s is Kind => s === "recipe" || s === "guide") };
}

// ---------------------------------------------------------------------------
// Callback signature (Kie calls back to /api/auto-content/kie?id=…&sig=…)
// ---------------------------------------------------------------------------
const secret = () => process.env.CRON_SECRET || process.env.ADMIN_SESSION_SECRET || "";
export const signId = (id: string) => createHmac("sha256", secret()).update(`kie:${id}`).digest("hex").slice(0, 32);
export function verifyId(id: string, sig: string) {
  if (!secret()) return false;
  const a = Buffer.from(signId(id));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// 1. Topics
// ---------------------------------------------------------------------------
const STOP = new Set(["the", "and", "with", "for", "how", "what", "your", "make", "easy", "simple", "best", "recipe", "guide", "malaysian", "style", "home", "quick", "to", "a", "an", "of", "in"]);
const words = (s: string) => new Set(canonical(s).split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)));
function tooSimilar(a: string, b: string) {
  const x = words(a);
  const y = words(b);
  if (!x.size || !y.size) return false;
  const inter = [...x].filter((w) => y.has(w)).length;
  return inter / (x.size + y.size - inter) >= 0.6;
}
export const normKeyword = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export async function planTopics(kind: Kind, count = 10, given?: ContentContext): Promise<number> {
  const ctx = given ?? (await loadContext());
  const { system, user } = plannerPrompt(ctx, kind, count);
  const plan = await structured<TopicPlan>({ model: WRITER_MODEL, system, user, name: "topic_plan", schema: topicPlanSchema, effort: "low", timeoutMs: 120_000 });
  const existing = ctx.existingTitles.map((t) => t.replace(/^\w+: /, ""));

  // Layers 1–2: same keyword, or mostly the same words once local names are normalised.
  let rows: { kind: Kind; keyword: string; topic: Topic }[] = [];
  for (const t of plan.topics) {
    const keyword = normKeyword(t.keywords.en || t.title);
    if (!keyword || ctx.usedKeywords.has(keyword) || rows.some((r) => r.keyword === keyword)) continue;
    if (existing.some((e) => tooSimilar(e, t.title)) || rows.some((r) => tooSimilar(r.topic.title, t.title))) continue;
    const title = t.title.replace(/^(recipe|guide)\s*:\s*/i, "").trim();
    rows.push({ kind, keyword, topic: { ...t, title, productSlugs: t.productSlugs.filter((s) => ctx.productSlugs.has(s)) } });
  }
  // Layer 3: same meaning (embeddings). Layer 4: an AI judge that knows Malaysian food names.
  const label = (r: (typeof rows)[number]) => `${r.topic.title} (${r.topic.keywords.en})`;
  const near = await similarTo(rows.map(label), existing, TOPIC_THRESHOLD);
  rows = rows.filter((_, i) => !near[i]);
  const dupes = await judgeDuplicates(rows.map(label), existing);
  rows = rows.filter((_, i) => !dupes.has(i));
  for (const r of rows) ctx.usedKeywords.add(r.keyword);

  if (rows.length) {
    const { error } = await db().from("auto_posts").upsert(rows, { onConflict: "keyword", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }
  return rows.length;
}

/** A topic typed in the admin. The writer fills in the BM/中文 keyword. */
export async function addTopic(kind: Kind, title: string, keyword: string) {
  const topic: Topic = { title: title.trim(), angle: "", keywords: { en: (keyword || title).trim(), ms: "", zh: "" }, productSlugs: [] };
  // Backdated so it is written before automatically planned topics (the queue takes the oldest first).
  const created_at = new Date(Date.now() - 10 * 365 * 86_400_000).toISOString();
  const { error } = await db().from("auto_posts").insert({ kind, keyword: normKeyword(topic.keywords.en), topic, created_at });
  if (error) throw new Error(/unique|duplicate/i.test(error.message) ? "That keyword is already planned or written." : error.message);
}

// ---------------------------------------------------------------------------
// 2. Write + check + review (one rewrite)
// ---------------------------------------------------------------------------
async function review(ctx: ContentContext, kind: Kind, draft: unknown): Promise<Review> {
  const { system, user } = reviewerPrompt(ctx, kind, draft);
  return structured<Review>({ model: REVIEW_MODEL, system, user, name: "review", schema: reviewSchema, effort: "low", timeoutMs: 90_000 });
}

async function write(ctx: ContentContext, kind: Kind, topic: Topic, fix?: { draft: unknown; issues: string[] }) {
  if (kind === "recipe") {
    const { system, user } = recipeWriterPrompt(ctx, topic, fix);
    const d = await structured<RecipeDraft>({ model: WRITER_MODEL, system, user, name: "recipe", schema: recipeSchema, effort: "low" });
    return checkRecipe(d, ctx);
  }
  const { system, user } = guideWriterPrompt(ctx, topic, fix);
  const d = await structured<GuideDraft>({ model: WRITER_MODEL, system, user, name: "guide", schema: guideSchema, effort: "low" });
  return checkGuide(d, ctx);
}

/** Writes, checks and reviews; rewrites once if anything needs fixing and there's time left. */
async function writeChecked(ctx: ContentContext, kind: Kind, topic: Topic, deadline: number) {
  let c = await write(ctx, kind, topic);
  let r = await review(ctx, kind, c.draft);
  const issues = [...c.hard, ...c.soft, ...r.issues.map((i) => `${i.severity === "blocker" ? "MUST FIX" : "fix"}: ${i.problem}`)];
  let rewritten = false;
  if (issues.length && Date.now() < deadline) {
    c = await write(ctx, kind, topic, { draft: c.draft, issues });
    r = await review(ctx, kind, c.draft);
    rewritten = true;
  }
  const blockers = [...c.hard, ...r.issues.filter((i) => i.severity === "blocker").map((i) => i.problem)];
  return { draft: c.draft, blockers, soft: c.soft, review: { ...r, rewritten, firstIssues: issues } };
}

function recipeRow(d: RecipeDraft, slug: string) {
  const opt = (l: LAll) => (l.en.trim() ? l : null);
  return {
    slug,
    title: d.title,
    excerpt: d.excerpt,
    intro: d.intro,
    prep_minutes: d.prepMinutes,
    cook_minutes: d.cookMinutes,
    servings: d.servings,
    difficulty: d.difficulty,
    cuisine: d.cuisine,
    course: COURSES[d.course] ?? COURSES.main,
    ingredients: d.ingredientGroups.map((g) => ({ group: opt(g.group), items: g.items })),
    steps: d.steps.map((s) => ({ title: opt(s.title), text: s.text })),
    tips: d.tips,
    keywords: d.keywords,
    product_slugs: d.productSlugs,
    meta_title: fitMetaTitles(d.metaTitle),
    meta_description: d.metaDescription,
  };
}

function guideRow(d: GuideDraft, slug: string) {
  return {
    slug,
    title: d.title,
    meta_title: fitMetaTitles(d.metaTitle),
    meta_description: d.metaDescription,
    lead: d.lead,
    image_alt: d.imageAlt,
    summary: d.summary,
    body: d.body,
    faqs: d.faqs,
    product_slugs: d.productSlugs,
    category_slugs: d.categorySlugs,
    recipe_slugs: d.recipeSlugs,
    related_slugs: d.relatedGuideSlugs,
    about: d.about,
  };
}

// ---------------------------------------------------------------------------
// 3. One post: claim a topic, write it, start the image
// ---------------------------------------------------------------------------
export async function runAutoPost(kind: Kind, opts: { force?: boolean; budgetMs?: number } = {}): Promise<RunResult> {
  const started = Date.now();
  const budget = opts.budgetMs ?? 270_000;
  const settings = await getAutoSettings();
  if (!settings.enabled && !opts.force) return { ok: true, message: "Auto posting is paused." };

  await sweep();
  const ctx = await loadContext();
  const { count } = await db().from("auto_posts").select("id", { count: "exact", head: true }).eq("kind", kind).eq("status", "planned");
  if ((count ?? 0) < 3) await planTopics(kind, 10, ctx);

  const { data: claimed, error } = await db().rpc("claim_auto_post", { p_kind: kind });
  if (error) throw new Error(error.message);
  const post = (claimed as AutoPost[] | null)?.[0];
  if (!post) return { ok: false, message: `No ${kind} topic available.` };

  try {
    // Leave ~110 s for a rewrite + review; skip the rewrite if the first pass was slow.
    const res = await writeChecked(ctx, kind, post.topic, started + budget - 110_000);
    // Layer 5: the finished title must not mean the same as anything already on the site.
    const published = ctx.existingTitles.filter((t) => /^(Recipe|Guide): /.test(t)).map((t) => t.replace(/^\w+: /, ""));
    const [dupOf] = await similarTo([res.draft.title.en], published, POST_THRESHOLD);
    if (dupOf) res.blockers.push(`duplicate of existing "${dupOf}"`);
    if (res.blockers.length) {
      await db().from("auto_posts").update({ status: "rejected", content: res.draft, review: res.review, error: res.blockers.join(" | ").slice(0, 2000) }).eq("id", post.id);
      return { ok: false, id: post.id, message: `Rejected "${post.topic.title}": ${res.blockers[0]}`, ms: Date.now() - started };
    }
    const { data: pending } = await db().from("auto_posts").select("slug").in("status", ["imaging", "publishing"]).eq("kind", kind);
    const taken = new Set([...(kind === "recipe" ? ctx.recipeSlugs : ctx.guideSlugs), ...(pending ?? []).map((p) => p.slug as string)]);
    const slug = uniqueSlug(res.draft.slug || post.topic.title, taken);
    const row = kind === "recipe" ? recipeRow(res.draft as RecipeDraft, slug) : guideRow(res.draft as GuideDraft, slug);
    const callback = process.env.VERCEL_ENV === "production" ? `${SITE.url}/api/auto-content/kie?id=${post.id}&sig=${signId(post.id)}` : undefined;
    const taskId = await createImageTask(res.draft.imagePrompt, kind === "recipe" ? "4:3" : "16:9", callback);
    await db()
      .from("auto_posts")
      .update({ status: "imaging", content: row, review: { ...res.review, imagePrompt: res.draft.imagePrompt }, kie_task_id: taskId, slug, error: null })
      .eq("id", post.id);
    return { ok: true, id: post.id, message: `Written "${row.title.en}" — photo in progress, publishes when ready.`, ms: Date.now() - started };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db()
      .from("auto_posts")
      .update({ status: post.attempts < MAX_ATTEMPTS ? "planned" : "failed", error: msg.slice(0, 2000) })
      .eq("id", post.id);
    return { ok: false, id: post.id, message: `Failed "${post.topic.title}": ${msg}`, ms: Date.now() - started };
  }
}

// ---------------------------------------------------------------------------
// 4. Image ready → publish
// ---------------------------------------------------------------------------
export async function finishImage(id: string): Promise<"published" | "waiting" | "failed" | "skipped"> {
  const { data: post } = await db().from("auto_posts").select("*").eq("id", id).maybeSingle<AutoPost>();
  if (!post || post.status !== "imaging" || !post.kie_task_id || !post.content || !post.slug) return "skipped";
  const task = await getImageTask(post.kie_task_id);
  if (task.state === "waiting") return "waiting";

  // Only one caller (callback or sweep) gets past this line.
  const { data: won } = await db().from("auto_posts").update({ status: "publishing" }).eq("id", id).eq("status", "imaging").select("id");
  if (!won?.length) return "skipped";

  const table = post.kind === "recipe" ? "recipes" : "guides";
  try {
    if (task.state === "fail" || !task.url) {
      if (post.attempts >= MAX_ATTEMPTS) throw new Error(`Image failed: ${task.error ?? "unknown"}`);
      const prompt = (post.review as { imagePrompt?: string } | null)?.imagePrompt ?? `${String((post.content.title as LAll).en)}, plated Malaysian home-style dish`;
      const callback = process.env.VERCEL_ENV === "production" ? `${SITE.url}/api/auto-content/kie?id=${post.id}&sig=${signId(post.id)}` : undefined;
      const taskId = await createImageTask(prompt, post.kind === "recipe" ? "4:3" : "16:9", callback);
      await db().from("auto_posts").update({ status: "imaging", kie_task_id: taskId, attempts: post.attempts + 1, error: `image retry: ${task.error ?? ""}` }).eq("id", id);
      return "waiting";
    }

    const png = Buffer.from(await (await fetch(task.url, { signal: AbortSignal.timeout(60_000) })).arrayBuffer());
    const { data: webp, info } = await sharp(png).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
    const path = `${table}/${post.slug}-${Date.now().toString(36)}.webp`;
    const up = await db().storage.from("media").upload(path, webp, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (up.error) throw new Error(`upload: ${up.error.message}`);

    let slug = post.slug;
    const row = { ...post.content, image_path: path, image_width: info.width, image_height: info.height, source: "auto", is_published: true, published_at: todayMY() };
    let ins = await db().from(table).insert({ ...row, slug }).select("id").single();
    if (ins.error && /unique|duplicate/i.test(ins.error.message)) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
      ins = await db().from(table).insert({ ...row, slug }).select("id").single();
    }
    if (ins.error) throw new Error(ins.error.message);

    await db().from("auto_posts").update({ status: "published", slug, published_at: new Date().toISOString(), error: null }).eq("id", id);
    revalidateTag(CONTENT_TAG, { expire: 0 });
    await submitToIndexNow(allLanguageUrls([`/${table}`, `/${table}/${slug}`]));
    return "published";
  } catch (e) {
    await db().from("auto_posts").update({ status: "failed", error: (e instanceof Error ? e.message : String(e)).slice(0, 2000) }).eq("id", id);
    return "failed";
  }
}

/** Finish photos whose callback never arrived, and unstick interrupted runs. */
export async function sweep(): Promise<{ published: number; waiting: number; failed: number }> {
  const out = { published: 0, waiting: 0, failed: 0 };
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
  await db().from("auto_posts").update({ status: "imaging" }).eq("status", "publishing").lt("updated_at", ago(15));
  await db().from("auto_posts").update({ status: "planned", error: "interrupted while writing" }).eq("status", "writing").lt("updated_at", ago(15)).lt("attempts", MAX_ATTEMPTS);
  await db().from("auto_posts").update({ status: "failed", error: "interrupted while writing" }).eq("status", "writing").lt("updated_at", ago(15));
  const { data } = await db().from("auto_posts").select("id").eq("status", "imaging").lt("updated_at", ago(2)).limit(10);
  for (const { id } of data ?? []) {
    const r = await finishImage(id);
    if (r === "published") out.published++;
    else if (r === "failed") out.failed++;
    else if (r === "waiting") out.waiting++;
  }
  return out;
}
