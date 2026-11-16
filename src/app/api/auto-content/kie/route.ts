import { finishImage, verifyId } from "@/lib/auto-content/pipeline";

/**
 * Kie.ai calls this when a photo task finishes. The body is not trusted: the URL carries a
 * signed post id, and finishImage() asks Kie for the task result with our own API key.
 */
export const maxDuration = 120;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const sig = url.searchParams.get("sig") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id) || !verifyId(id, sig)) return Response.json({ ok: false }, { status: 401 });
  const result = await finishImage(id);
  return Response.json({ ok: true, result });
}
