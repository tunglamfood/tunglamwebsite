import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { erp } from "./erp";

/**
 * Real one-time sign-in codes, sent by SMS through OneWay SMS (Malaysia).
 *
 * Only an HMAC of the code is stored (table portal_otp in the ERP database),
 * for 5 minutes and 5 tries. A new request replaces the previous code.
 * Switched on by setting ONEWAYSMS_API_USERNAME and ONEWAYSMS_API_PASSWORD,
 * and switching demo mode off (unset PORTAL_DEMO_OTP).
 */

const TTL_MIN = 5;
const MAX_TRIES = 5;

export function smsConfigured() {
  return !!(process.env.ONEWAYSMS_API_USERNAME?.trim() && process.env.ONEWAYSMS_API_PASSWORD?.trim());
}

function hash(phone: string, code: string) {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret) throw new Error("PORTAL_SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(`otp:${phone}:${code}`).digest("hex");
}

/** Sends a code by SMS. Returns false when the SMS could not be sent. */
export async function issueCode(phone: string): Promise<boolean> {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const db = erp();
  const { error } = await db.from("portal_otp").upsert(
    {
      phone,
      code_hash: hash(phone, code),
      expires_at: new Date(Date.now() + TTL_MIN * 60_000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    },
    { onConflict: "phone" },
  );
  if (error) return false;

  const sent = await sendSms(phone, `RM0.00 Tung Lam: Your dealer portal code is ${code}. Valid for ${TTL_MIN} minutes. Do not share it.`);
  if (!sent) await db.from("portal_otp").delete().eq("phone", phone);
  return sent;
}

/** True once for the right code within its time; the code is used up on success. */
export async function checkCode(phone: string, code: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code)) return false;
  const db = erp();
  const { data } = await db.from("portal_otp").select("code_hash, expires_at, attempts").eq("phone", phone).maybeSingle();
  if (!data || new Date(data.expires_at).getTime() < Date.now() || data.attempts >= MAX_TRIES) return false;

  const a = Buffer.from(hash(phone, code), "hex");
  const b = Buffer.from(String(data.code_hash), "hex");
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (ok) {
    await db.from("portal_otp").delete().eq("phone", phone);
  } else {
    await db.from("portal_otp").update({ attempts: data.attempts + 1 }).eq("phone", phone);
  }
  return ok;
}

/** OneWay SMS HTTP API: a positive number back means sent; negative is an error code. */
async function sendSms(phone: string, message: string): Promise<boolean> {
  const url = new URL(process.env.ONEWAYSMS_MT_URL?.trim() || "https://gateway.onewaysms.com.my/api.aspx");
  url.searchParams.set("apiusername", process.env.ONEWAYSMS_API_USERNAME!.trim());
  url.searchParams.set("apipassword", process.env.ONEWAYSMS_API_PASSWORD!.trim());
  url.searchParams.set("mobileno", phone.replace(/\D/g, ""));
  url.searchParams.set("senderid", process.env.ONEWAYSMS_SENDER_ID?.trim() || "INFO");
  url.searchParams.set("languagetype", "1");
  url.searchParams.set("message", message);
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const body = (await res.text()).trim();
    const n = Number(body);
    if (!res.ok || !Number.isFinite(n) || n <= 0) {
      console.error(`OneWay SMS failed: HTTP ${res.status}, response ${body.slice(0, 40)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("OneWay SMS unreachable:", (e as Error).message);
    return false;
  }
}
