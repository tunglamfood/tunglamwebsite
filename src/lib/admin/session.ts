/**
 * Admin session token: "<expiry-unix-seconds>.<hmac-sha256-hex>".
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

export async function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return `${exp}.${await hmacHex(`admin.${exp}`)}`;
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  try {
    return safeEqual(sig, await hmacHex(`admin.${exp}`));
  } catch {
    return false;
  }
}

/** Compare a submitted password to ADMIN_PASSWORD without leaking timing. */
export async function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([hmacHex(`pw.${input}`), hmacHex(`pw.${expected}`)]);
  return safeEqual(a, b);
}
