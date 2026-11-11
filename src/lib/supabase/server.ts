import "server-only";
import { createClient } from "@supabase/supabase-js";

export const CONTENT_TAG = "content";
export const REVALIDATE_SECONDS = 3600;

/**
 * Read-only Supabase client for public content (anon key, RLS-protected).
 * Every request goes through Next's fetch cache so pages can be statically
 * generated and revalidated hourly, or on demand via revalidateTag("content").
 */
export function contentClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_ANON_KEY are not set");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] } }),
    },
  });
}
