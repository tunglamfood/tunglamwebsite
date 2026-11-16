import "server-only";
import { REVIEW_MODEL, structured } from "./openai";

/**
 * Duplicate protection for auto content, in layers:
 *  1. one post per primary keyword (unique constraint on auto_posts.keyword);
 *  2. local names normalised (tau pok = tofu puffs, mee = noodles…), then word overlap;
 *  3. meaning: OpenAI embeddings, cosine ≥ TOPIC_THRESHOLD against everything that exists;
 *  4. an AI judge that sees all existing titles and knows the local food names;
 *  5. before publishing, the finished title is checked again (POST_THRESHOLD).
 * Thresholds were calibrated on real titles: same dish/question 0.72–0.80, different 0.50–0.62.
 */
export const TOPIC_THRESHOLD = 0.68;
export const POST_THRESHOLD = 0.8;

const SYNONYMS: [RegExp, string][] = [
  [/\b(tau ?pok|tauhu ?pok|taufu ?pok|tofu ?goreng|taufu ?goreng|tauhu ?goreng ?bulat|tofu puffs?|fried tofu puffs?)\b|豆卜|豆泡/gi, " tofu puffs "],
  [/\b(tau ?kwa|tau ?kua|taufu ?keras|tauhu ?keras|firm tofu|pressed tofu)\b|豆干/gi, " firm tofu "],
  [/\b(tauhu ?telur|taufu ?telur|japanese tofu|tamago tofu|egg tofu)\b|鸡蛋豆腐|日本豆腐/gi, " egg tofu "],
  [/\b(tauhu ?lembut|taufu ?lembut|tauhu ?sutera|silken tofu|soft tofu)\b|嫩豆腐/gi, " silken tofu "],
  [/\b(tauhu|taufu|beancurd|bean curd)\b|豆腐/gi, " tofu "],
  [/\b(bebola ?ikan|fish ?balls?|fishball)\b|鱼丸/gi, " fish balls "],
  [/\b(kek ?ikan|fish ?cakes?|fishcake)\b|鱼饼/gi, " fish cake "],
  [/\b(isi ?ikan|kuih ?ikan|fish ?paste)\b|鱼浆/gi, " fish paste "],
  [/\b(telur ?puyuh|quail ?eggs?)\b|鹌鹑蛋/gi, " quail eggs "],
  [/\b(cincau|grass ?jelly|leong ?fun)\b|仙草|凉粉/gi, " grass jelly "],
  [/\b(stimbot|steam ?boat|hot ?pot|lok ?lok)\b|火锅|打边炉/gi, " steamboat "],
  [/\b(yong ?tau ?f[ou]o|yong ?tau ?fu|niang ?dou ?fu)\b|酿豆腐/gi, " yong tau foo "],
  [/\b(mee|mi|mian)\b|面/gi, " noodles "],
  [/\b(kari|curry)\b|咖喱/gi, " curry "],
  [/\b(sup|soup)\b|汤/gi, " soup "],
];

export function canonical(s: string) {
  let x = ` ${s.toLowerCase()} `;
  for (const [re, to] of SYNONYMS) x = x.replace(re, to);
  return x.replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: texts.map(canonical) }),
    signal: AbortSignal.timeout(60_000),
  });
  const j = (await res.json()) as { data?: { embedding: number[] }[]; error?: { message?: string } };
  if (!res.ok || !j.data) throw new Error(`OpenAI embeddings ${res.status}: ${j.error?.message ?? "failed"}`);
  return j.data.map((d) => d.embedding);
}

const cosine = (a: number[], b: number[]) => {
  let s = 0;
  let x = 0;
  let y = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
    x += a[i] * a[i];
    y += b[i] * b[i];
  }
  return s / Math.sqrt(x * y);
};

/** For each candidate, the existing title it duplicates (or null). Candidates are also checked against each other. */
export async function similarTo(candidates: string[], existing: string[], threshold: number): Promise<(string | null)[]> {
  const vecs = await embed([...existing, ...candidates]);
  const ex = vecs.slice(0, existing.length);
  const cv = vecs.slice(existing.length);
  const kept: { title: string; v: number[] }[] = [];
  return candidates.map((c, i) => {
    let best: { s: number; t: string } = { s: 0, t: "" };
    ex.forEach((v, j) => {
      const s = cosine(cv[i], v);
      if (s > best.s) best = { s, t: existing[j] };
    });
    for (const k of kept) {
      const s = cosine(cv[i], k.v);
      if (s > best.s) best = { s, t: k.title };
    }
    if (best.s >= threshold) return best.t;
    kept.push({ title: c, v: cv[i] });
    return null;
  });
}

/** Last layer for topics: an AI judge that knows Malaysian food names. Returns indexes to drop. */
export async function judgeDuplicates(candidates: string[], existing: string[]): Promise<Set<number>> {
  if (candidates.length === 0) return new Set();
  const out = await structured<{ duplicates: number[] }>({
    model: REVIEW_MODEL,
    name: "duplicates",
    effort: "low",
    timeoutMs: 60_000,
    schema: {
      type: "object",
      properties: { duplicates: { type: "array", items: { type: "integer" } } },
      required: ["duplicates"],
      additionalProperties: false,
    },
    system:
      "You prevent duplicate content on a Malaysian food website. A candidate is a DUPLICATE if it is essentially the same dish, or answers the same question, as an existing title or as an earlier candidate — even if worded differently or using local names (tau pok = tofu puffs = tofu goreng = 豆卜; tau kwa = taufu keras = firm tofu = 豆干; tauhu telur = egg tofu = Japanese tofu; mee = noodles; telur puyuh = quail eggs; cincau = grass jelly; stimbot = steamboat). A different dish using the same product is NOT a duplicate. Return the numbers of the duplicate candidates.",
    user: `EXISTING TITLES:\n${existing.map((t) => `- ${t}`).join("\n") || "(none)"}\n\nCANDIDATES:\n${candidates.map((t, i) => `${i}. ${t}`).join("\n")}`,
  });
  return new Set(out.duplicates.filter((i) => i >= 0 && i < candidates.length));
}
