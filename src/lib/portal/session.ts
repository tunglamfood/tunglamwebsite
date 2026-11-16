/**
 * Dealer portal session: "<base64url(json)>.<hmac-sha256-hex>" in an httpOnly cookie.
 * The payload holds the portal account id and, for reps and chain groups, the
 * dealer they are currently ordering for. Web Crypto only, so the same code runs
 * in src/proxy.ts and on the server.
 *
 * The account is re-read from the ERP on every request, so switching a login
 * off in the ERP takes effect immediately even if the cookie is still valid.
 */
export const PORTAL_COOKIE = "tl_portal";
export const PORTAL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type PortalSession = { a: number; c: string | null; exp: number };

const enc = new TextEncoder();

function secret() {
  const s = process.env.PORTAL_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("PORTAL_SESSION_SECRET is missing or too short");
  return s;
}

async function hmacHex(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function b64url(s: string) {
  return btoa(String.fromCharCode(...enc.encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signPortalSession(accountId: number, customerCode: string | null): Promise<string> {
  const payload: PortalSession = { a: accountId, c: customerCode, exp: Math.floor(Date.now() / 1000) + PORTAL_TTL_SECONDS };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${await hmacHex(`portal.${body}`)}`;
}

export async function readPortalSession(token: string | undefined | null): Promise<PortalSession | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!safeEqual(sig, await hmacHex(`portal.${body}`))) return null;
    const s = JSON.parse(fromB64url(body)) as PortalSession;
    if (typeof s.a !== "number" || !s.exp || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}
