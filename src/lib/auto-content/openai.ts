import "server-only";

/** Models: override in Vercel with OPENAI_MODEL / OPENAI_REVIEW_MODEL without a code change. */
export const WRITER_MODEL = process.env.OPENAI_MODEL || "gpt-5.4";
export const REVIEW_MODEL = process.env.OPENAI_REVIEW_MODEL || "gpt-5.4-mini";

type Effort = "minimal" | "low" | "medium" | "high";

/**
 * One call to the OpenAI Responses API with a strict JSON schema; returns the parsed object.
 * Throws on HTTP errors, refusals and truncated output, so callers never publish half a post.
 */
export async function structured<T>(opts: {
  model: string;
  system: string;
  user: string;
  name: string;
  schema: Record<string, unknown>;
  effort?: Effort;
  timeoutMs?: number;
}): Promise<T> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: opts.model,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      text: { format: { type: "json_schema", name: opts.name, schema: opts.schema, strict: true } },
      reasoning: { effort: opts.effort ?? "low" },
      max_output_tokens: 32_000,
      store: false,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 200_000),
  });
  const j = (await res.json()) as {
    status?: string;
    error?: { message?: string } | null;
    incomplete_details?: { reason?: string } | null;
    output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  };
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${j.error?.message ?? "request failed"}`);
  if (j.status === "incomplete") throw new Error(`OpenAI output incomplete (${j.incomplete_details?.reason ?? "unknown"})`);
  const parts = (j.output ?? []).flatMap((o) => (o.type === "message" ? (o.content ?? []) : []));
  const refusal = parts.find((c) => c.type === "refusal");
  if (refusal) throw new Error(`OpenAI refused: ${refusal.refusal ?? ""}`);
  const text = parts.find((c) => c.type === "output_text")?.text;
  if (!text) throw new Error("OpenAI returned no text");
  return JSON.parse(text) as T;
}
