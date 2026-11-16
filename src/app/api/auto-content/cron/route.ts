import { getAutoSettings, runAutoPost, sweep, type Kind } from "@/lib/auto-content/pipeline";

/**
 * Daily auto content, called by Vercel Cron (vercel.json) with `Authorization: Bearer $CRON_SECRET`.
 *   ?slot=N   writes the post configured for slot N in auto_settings.slots (default recipe, recipe, guide)
 *   ?kind=…   writes a recipe or guide regardless of slot (manual runs)
 *   ?sweep=1  only publishes posts whose photo finished but whose callback was missed
 * One post per call keeps each run inside the 300-second function limit.
 */
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const url = new URL(request.url);
  if (url.searchParams.has("sweep")) return Response.json({ ok: true, sweep: await sweep() });

  const { enabled, slots } = await getAutoSettings();
  if (!enabled) return Response.json({ ok: true, message: "Auto posting is paused.", sweep: await sweep() });

  const asked = url.searchParams.get("kind");
  const kind: Kind | undefined = asked === "recipe" || asked === "guide" ? asked : slots[Number(url.searchParams.get("slot") ?? 0)];
  if (!kind) return Response.json({ ok: true, message: "No post configured for this slot.", sweep: await sweep() });

  const result = await runAutoPost(kind);
  console.log(`[auto-content] ${kind}: ${result.message} (${result.ms ?? 0} ms)`);
  return Response.json(result);
}
