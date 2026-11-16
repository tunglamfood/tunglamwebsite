import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The ERP database (tunglam.vercel.app's), reached only from this server with
 * the dedicated "tunglamfood_portal" secret key. Nothing here is cached: prices
 * and order statuses must always be current.
 */
let client: SupabaseClient | null = null;

export function erp(): SupabaseClient {
  if (client) return client;
  const url = process.env.ERP_SUPABASE_URL;
  const key = process.env.ERP_SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("ERP_SUPABASE_URL / ERP_SUPABASE_SECRET_KEY are not set");
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}

/** Turns a "portal:reason" error raised by the ERP's database functions into its reason. */
export function portalReason(message: string | undefined): string {
  const m = /portal:([a-z_]+)/.exec(message ?? "");
  return m ? m[1] : "unknown";
}
