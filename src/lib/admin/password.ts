import "server-only";
import { scrypt, timingSafeEqual } from "node:crypto";

/**
 * Checks a staff password against its hash in the ERP's `erp_users` table.
 * Same format as the ERP's src/lib/password.ts (which creates the hashes):
 *   scrypt$<N>$<r>$<p>$<salt>$<hash>   (salt and hash base64url)
 * Keep the two in step.
 */
function derive(password: string, salt: Buffer, n: number, r: number, p: number, len: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize("NFKC"), salt, len, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  if (![n, r, p].every((x) => Number.isInteger(x) && x > 0) || n > 1 << 17) return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length < 8 || expected.length < 16) return false;
  const got = await derive(password, salt, n, r, p, expected.length);
  return timingSafeEqual(got, expected);
}

/** Checked when the username is unknown, so both answers take as long. */
export const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
