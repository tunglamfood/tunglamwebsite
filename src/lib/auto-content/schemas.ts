/** Strict JSON schemas (OpenAI structured output) and their TypeScript shapes. */

const str = { type: "string" } as const;
const int = { type: "integer" } as const;
const strList = { type: "array", items: str } as const;
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const L = obj({ en: str, ms: str, zh: str });
const LL = obj({ en: strList, ms: strList, zh: strList });

export type LAll = { en: string; ms: string; zh: string };
export type LLAll = { en: string[]; ms: string[]; zh: string[] };

/** Recipe "course" labels, fixed so the site's filters and cards stay consistent. */
export const COURSES = {
  main: { en: "Main", ms: "Hidangan Utama", zh: "主菜" },
  side: { en: "Side", ms: "Hidangan Sampingan", zh: "配菜" },
  soup: { en: "Soup", ms: "Sup", zh: "汤" },
  snack: { en: "Snack", ms: "Snek", zh: "小吃" },
  dessert: { en: "Dessert", ms: "Pencuci Mulut", zh: "甜品" },
  drink: { en: "Drink", ms: "Minuman", zh: "饮品" },
  breakfast: { en: "Breakfast", ms: "Sarapan", zh: "早餐" },
} as const;
export type CourseKey = keyof typeof COURSES;

// ---------------------------------------------------------------------------
export type TopicPlan = { topics: { title: string; angle: string; keywords: LAll; productSlugs: string[] }[] };
export const topicPlanSchema = obj({
  topics: { type: "array", items: obj({ title: str, angle: str, keywords: L, productSlugs: strList }) },
});

// ---------------------------------------------------------------------------
export type RecipeDraft = {
  slug: string;
  title: LAll;
  metaTitle: LAll;
  metaDescription: LAll;
  excerpt: LAll;
  intro: LAll;
  cuisine: LAll;
  course: CourseKey;
  difficulty: "easy" | "medium";
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredientGroups: { group: LAll; items: LLAll }[];
  steps: { title: LAll; text: LAll }[];
  tips: LLAll;
  keywords: LLAll;
  productSlugs: string[];
  imagePrompt: string;
};
export const recipeSchema = obj({
  slug: str,
  title: L,
  metaTitle: L,
  metaDescription: L,
  excerpt: L,
  intro: L,
  cuisine: L,
  course: { type: "string", enum: Object.keys(COURSES) },
  difficulty: { type: "string", enum: ["easy", "medium"] },
  prepMinutes: int,
  cookMinutes: int,
  servings: int,
  ingredientGroups: { type: "array", items: obj({ group: L, items: LL }) },
  steps: { type: "array", items: obj({ title: L, text: L }) },
  tips: LL,
  keywords: LL,
  productSlugs: strList,
  imagePrompt: str,
});

// ---------------------------------------------------------------------------
export type GuideDraft = {
  slug: string;
  title: LAll;
  metaTitle: LAll;
  metaDescription: LAll;
  lead: LAll;
  imageAlt: LAll;
  summary: LLAll;
  body: LAll;
  faqs: { q: LAll; a: LAll }[];
  productSlugs: string[];
  recipeSlugs: string[];
  relatedGuideSlugs: string[];
  categorySlugs: string[];
  about: string[];
  imagePrompt: string;
};
export const guideSchema = obj({
  slug: str,
  title: L,
  metaTitle: L,
  metaDescription: L,
  lead: L,
  imageAlt: L,
  summary: LL,
  body: L,
  faqs: { type: "array", items: obj({ q: L, a: L }) },
  productSlugs: strList,
  recipeSlugs: strList,
  relatedGuideSlugs: strList,
  categorySlugs: strList,
  about: strList,
  imagePrompt: str,
});

// ---------------------------------------------------------------------------
export type Review = { issues: { severity: "blocker" | "minor"; problem: string }[] };
export const reviewSchema = obj({
  issues: { type: "array", items: obj({ severity: { type: "string", enum: ["blocker", "minor"] }, problem: str }) },
});
