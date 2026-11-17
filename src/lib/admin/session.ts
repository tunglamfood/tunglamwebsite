/**
 * Admin session token: "<expiry-unix-seconds>.<user-id>.<session-version>.<hmac-sha256-hex>".
 * The user is a staff login from the ERP (`erp_users`); the version must still match
 * theirs, so a login that is switched off, reset or loses "Website content" stops working.
 * Uses Web Crypto only, so it works in both src/proxy.ts and server actions.
 */
export const ADMIN_COOKIE = "tl_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET is missing or too short");
  return s;
}

async function hmacHex(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(userId: number, version: number) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${userId}.${version}.${await hmacHex(`admin.${exp}.${userId}.${version}`)}`;
}

/** The signed-in staff login's id and session version, or null. */
export async function verifySessionToken(token: string | undefined | null): Promise<{ userId: number; version: number } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [exp, userId, version] = parts.slice(0, 3).map(Number);
  const sig = parts[3];
  if (!exp || !userId || !version || !sig || exp < Math.floor(Date.now() / 1000)) return null;
  try {
    return safeEqual(sig, await hmacHex(`admin.${exp}.${userId}.${version}`)) ? { userId, version } : null;
  } catch {
    return null;
  }
}
