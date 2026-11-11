import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/supabase/server";

/**
 * On-demand revalidation after editing content in Supabase.
 *   curl -X POST https://tunglamfood.my/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
 * Can also be wired to a Supabase Database Webhook.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CONTENT_TAG, "max");
  return Response.json({ ok: true, revalidated: CONTENT_TAG, at: new Date().toISOString() });
}
