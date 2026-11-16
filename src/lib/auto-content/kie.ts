import "server-only";

/** Kie.ai, GPT Image 2.6 ("flare") at 1K — the project's standard image model (see .claude/skills/kie-image). */
const API = "https://api.kie.ai/api/v1/jobs";
const MODEL = "gpt-image-2-6/flare-text-to-image";

export const HOUSE_STYLE =
  "Editorial food photography for a premium Malaysian food brand, soft natural daylight, warm neutral stone and linen surfaces, appetising true-to-life colours, shallow depth of field. No text, no logos, no packaging, no labels, no people's faces. Halal food only.";

function headers() {
  const key = process.env.KIE_API_KEY;
  if (!key) throw new Error("KIE_API_KEY is not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function createImageTask(prompt: string, aspect: "16:9" | "4:3", callBackUrl?: string): Promise<string> {
  const res = await fetch(`${API}/createTask`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      model: MODEL,
      ...(callBackUrl ? { callBackUrl } : {}),
      input: { prompt: `${prompt.trim()} ${HOUSE_STYLE}`, aspect_ratio: aspect, resolution: "1K", quality: "high", output_format: "png" },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const j = (await res.json()) as { code?: number; msg?: string; data?: { taskId?: string } };
  if (j.code !== 200 || !j.data?.taskId) throw new Error(`Kie createTask failed: ${j.msg ?? res.status}`);
  return j.data.taskId;
}

export type ImageTask = { state: "waiting" | "success" | "fail"; url?: string; error?: string };

export async function getImageTask(taskId: string): Promise<ImageTask> {
  const res = await fetch(`${API}/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers: headers(), signal: AbortSignal.timeout(20_000) });
  const j = (await res.json()) as { data?: { state?: string; resultJson?: string; failCode?: string; failMsg?: string } };
  const state = j.data?.state;
  if (state === "success") {
    const urls = (JSON.parse(j.data?.resultJson ?? "{}") as { resultUrls?: string[] }).resultUrls ?? [];
    return urls[0] ? { state: "success", url: urls[0] } : { state: "fail", error: "no result URL" };
  }
  if (state === "fail") return { state: "fail", error: `${j.data?.failCode ?? ""} ${j.data?.failMsg ?? ""}`.trim() };
  return { state: "waiting" };
}
