import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { erp } from "./erp";
import { PORTAL_COOKIE, readPortalSession } from "./session";
import { PORTAL_DICT, PORTAL_LANG_COOKIE, isPortalLang, type PortalLang } from "./i18n";

export type PortalAccount = {
  id: number;
  phone: string;
  name: string;
  role: "dealer" | "rep";
  customerCode: string | null;
  groupCode: string | null;
  repCode: string | null;
};

export type PortalCustomer = {
  code: string;
  name: string;
  shortName: string;
  state: string;
  address: string | null;
  contact: string | null;
  currency: "MYR" | "SGD";
};

export type PortalContext = {
  account: PortalAccount;
  /** Every dealer this login may order for (one for a plain dealer login). */
  customers: PortalCustomer[];
  /** The dealer currently being ordered for, or null when a rep/group has not chosen yet. */
  customer: PortalCustomer | null;
};

export const getPortalLang = cache(async (): Promise<PortalLang> => {
  const v = (await cookies()).get(PORTAL_LANG_COOKIE)?.value;
  return isPortalLang(v) ? v : "en";
});

export async function getPortalDict() {
  return PORTAL_DICT[await getPortalLang()];
}

/** The signed-in portal user, re-checked against the ERP on every request. */
export const getPortal = cache(async (): Promise<PortalContext | null> => {
  const session = await readPortalSession((await cookies()).get(PORTAL_COOKIE)?.value);
  if (!session) return null;

  const db = erp();
  const { data: acc } = await db
    .from("portal_accounts")
    .select("id, phone, name, role, customer_code, group_code, rep_code, active")
    .eq("id", session.a)
    .maybeSingle();
  if (!acc || !acc.active) return null;

  const { data: codes } = await db.rpc("portal_allowed_customers", { p_account: acc.id });
  const allowed = ((codes ?? []) as unknown[]).map((c) => (typeof c === "string" ? c : String(Object.values(c as object)[0])));
  let customers: PortalCustomer[] = [];
  if (allowed.length > 0) {
    const { data: rows } = await db
      .from("sales_customers")
      .select("code, name, short_name, state, address, contact, currency")
      .in("code", allowed)
      .order("name");
    customers = (rows ?? []).map((r) => ({
      code: r.code,
      name: r.name,
      shortName: r.short_name ?? "",
      state: r.state ?? "",
      address: r.address,
      contact: r.contact,
      currency: (r.currency ?? "MYR") as "MYR" | "SGD",
    }));
  }

  const customer =
    customers.find((c) => c.code === session.c) ?? (customers.length === 1 ? customers[0] : null);

  return {
    account: {
      id: acc.id,
      phone: acc.phone,
      name: acc.name,
      role: acc.role,
      customerCode: acc.customer_code,
      groupCode: acc.group_code,
      repCode: acc.rep_code,
    },
    customers,
    customer,
  };
});

/** For portal pages: signed in, or off to the login page. */
export async function requirePortal(): Promise<PortalContext> {
  const ctx = await getPortal();
  if (!ctx) redirect("/portal/login");
  return ctx;
}

/** For pages that need a dealer chosen (catalogue, cart, orders). */
export async function requireCustomer(): Promise<PortalContext & { customer: PortalCustomer }> {
  const ctx = await requirePortal();
  if (!ctx.customer) redirect("/portal/dealers");
  return ctx as PortalContext & { customer: PortalCustomer };
}

export function customerLabel(c: PortalCustomer) {
  return c.shortName && c.shortName !== c.name ? `${c.shortName} · ${c.name}` : c.name;
}
