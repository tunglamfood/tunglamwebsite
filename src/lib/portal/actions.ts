"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { erp, portalReason } from "./erp";
import { getPortal } from "./context";
import { normalisePhone } from "./phone";
import { PORTAL_COOKIE, PORTAL_TTL_SECONDS, signPortalSession } from "./session";
import { PORTAL_LANG_COOKIE, isPortalLang } from "./i18n";

/* ── Sign in: phone → one-time code ────────────────────────────────────────── */

export type LoginState =
  | { step: "phone"; error?: "badPhone" | "notRegistered" | "tooMany" | "smsUnavailable"; phone?: string }
  | { step: "code"; phone: string; error?: "badCode" | "tooMany" };

const WINDOW_MIN = 15;
const MAX_SENDS_PER_PHONE = 5;
const MAX_FAILS_PER_PHONE = 5;
const MAX_SENDS_PER_IP = 30;

async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

async function recent(filter: { phone?: string; ip?: string }, kind: string) {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString();
  let q = erp().from("portal_auth_events").select("id", { count: "exact", head: true }).eq("kind", kind).gte("at", since);
  if (filter.phone) q = q.eq("phone", filter.phone);
  if (filter.ip) q = q.eq("ip", filter.ip);
  const { count } = await q;
  return count ?? 0;
}

async function logAuth(phone: string, ip: string, kind: "send" | "ok" | "fail" | "blocked") {
  await erp().from("portal_auth_events").insert({ phone, ip, kind });
}

async function activeAccount(phone: string) {
  const { data } = await erp()
    .from("portal_accounts")
    .select("id, customer_code, active")
    .eq("phone", phone)
    .maybeSingle();
  return data && data.active ? (data as { id: number; customer_code: string | null }) : null;
}

/** Demo mode: every registered phone signs in with PORTAL_DEMO_OTP. Unset it to switch demo login off. */
function demoCode() {
  const c = process.env.PORTAL_DEMO_OTP?.trim();
  return c && /^\d{4,8}$/.test(c) ? c : null;
}

export async function requestCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const raw = String(formData.get("phone") ?? "");
  const phone = normalisePhone(raw);
  if (!phone) return { step: "phone", error: "badPhone", phone: raw };
  const ip = await clientIp();

  if ((await recent({ phone }, "send")) >= MAX_SENDS_PER_PHONE || (await recent({ ip }, "send")) >= MAX_SENDS_PER_IP) {
    await logAuth(phone, ip, "blocked");
    return { step: "phone", error: "tooMany", phone: raw };
  }
  if (!(await activeAccount(phone))) {
    await new Promise((r) => setTimeout(r, 400));
    return { step: "phone", error: "notRegistered", phone: raw };
  }

  if (!demoCode()) {
    // Phase 4: send a real code by SMS / WhatsApp here (e.g. OneWay SMS), store its hash with an expiry.
    return { step: "phone", error: "smsUnavailable", phone: raw };
  }
  await logAuth(phone, ip, "send");
  return { step: "code", phone };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const phone = normalisePhone(String(formData.get("phone") ?? ""));
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!phone) return { step: "phone", error: "badPhone" };
  const ip = await clientIp();

  if ((await recent({ phone }, "fail")) >= MAX_FAILS_PER_PHONE) {
    await logAuth(phone, ip, "blocked");
    return { step: "code", phone, error: "tooMany" };
  }
  const account = await activeAccount(phone);
  const expected = demoCode();
  const ok = !!account && !!expected && code.length === expected.length && timingSafe(code, expected);
  if (!ok || !account) {
    await logAuth(phone, ip, "fail");
    await new Promise((r) => setTimeout(r, 500));
    return { step: "code", phone, error: "badCode" };
  }

  await logAuth(phone, ip, "ok");
  await erp().from("portal_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", account.id);
  await setSession(account.id, account.customer_code);
  redirect("/portal");
}

function timingSafe(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

async function setSession(accountId: number, customerCode: string | null) {
  (await cookies()).set(PORTAL_COOKIE, await signPortalSession(accountId, customerCode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PORTAL_TTL_SECONDS,
  });
}

export async function logout() {
  (await cookies()).delete(PORTAL_COOKIE);
  redirect("/portal/login");
}

/* ── Preferences ───────────────────────────────────────────────────────────── */

export async function chooseDealer(formData: FormData) {
  const ctx = await getPortal();
  if (!ctx) redirect("/portal/login");
  const code = String(formData.get("code") ?? "");
  if (!ctx.customers.some((c) => c.code === code)) redirect("/portal/dealers");
  await setSession(ctx.account.id, code);
  redirect("/portal");
}

export async function setPortalLang(lang: string) {
  if (!isPortalLang(lang)) return;
  (await cookies()).set(PORTAL_LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

/* ── Orders ────────────────────────────────────────────────────────────────── */

export type PlaceOrderInput = {
  lines: { itemCode: string; qty: number }[];
  deliverOn: string | null;
  theirRef: string;
  note: string;
};

export type PlaceOrderResult = { ok: true; orderNo: string } | { ok: false; reason: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const ctx = await getPortal();
  if (!ctx) return { ok: false, reason: "signed_out" };
  if (!ctx.customer) return { ok: false, reason: "no_dealer" };

  const lines = (Array.isArray(input?.lines) ? input.lines : [])
    .map((l) => ({ item_code: String(l.itemCode ?? "").trim(), qty: Math.floor(Number(l.qty)) }))
    .filter((l) => l.item_code && l.qty > 0);
  if (lines.length === 0) return { ok: false, reason: "no_lines" };
  const deliverOn = input.deliverOn && /^\d{4}-\d{2}-\d{2}$/.test(input.deliverOn) ? input.deliverOn : null;

  const { data, error } = await erp().rpc("portal_place_order", {
    p_account: ctx.account.id,
    p_customer: ctx.customer.code,
    p_lines: lines,
    p_deliver_on: deliverOn,
    p_their_ref: String(input.theirRef ?? "").slice(0, 60),
    p_note: String(input.note ?? "").slice(0, 1000),
  });
  if (error) {
    console.error("portal_place_order failed", error.message);
    return { ok: false, reason: portalReason(error.message) };
  }
  return { ok: true, orderNo: String(data) };
}

export async function cancelOrder(orderNo: string): Promise<{ ok: boolean; reason?: string }> {
  const ctx = await getPortal();
  if (!ctx) return { ok: false, reason: "signed_out" };
  const { error } = await erp().rpc("portal_cancel_order", { p_account: ctx.account.id, p_order_no: orderNo, p_reason: null });
  if (error) return { ok: false, reason: portalReason(error.message) };
  return { ok: true };
}
