import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { erp } from "@/lib/portal/erp";
import { ADMIN_COOKIE, verifySessionToken } from "./session";

/** A staff login (from the ERP) that may edit the website. */
export type AdminUser = { id: number; name: string; username: string };

/**
 * Who is signed in to /admin, re-checked against their ERP staff login on every
 * request: switched off, password reset, or "Website content" taken away → signed out.
 */
export const currentAdmin = cache(async (): Promise<AdminUser | null> => {
  const store = await cookies();
  const claims = await verifySessionToken(store.get(ADMIN_COOKIE)?.value);
  if (!claims) return null;
  try {
    const { data, error } = await erp()
      .from("erp_users")
      .select("id, name, username, areas, active, session_version")
      .eq("id", claims.userId)
      .maybeSingle();
    if (error || !data) return null;
    if (!data.active || data.session_version !== claims.version || !(data.areas as string[]).includes("website")) return null;
    return { id: data.id as number, name: data.name as string, username: data.username as string };
  } catch {
    return null;
  }
});

export async function isAdmin() {
  return (await currentAdmin()) !== null;
}

/** Use at the top of every admin page and every admin server action. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await currentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
