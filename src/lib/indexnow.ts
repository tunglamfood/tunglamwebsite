import "server-only";
import { SITE } from "./site";
import { LOCALES, localePath } from "./i18n";

/**
 * IndexNow: tells Bing (which ChatGPT search and Copilot draw on), Yandex, Seznam and
 * Naver that pages changed, so they recrawl in minutes instead of weeks. Google does not
 * use IndexNow — it reads the sitemap.
 *
 * The key is public by design: search engines check it at /{key}.txt (public/ folder).
 */
export const INDEXNOW_KEY = "542f334e745ca5795ba53b54d159ee19";

/** Every language version of locale-agnostic paths ("/products/x" → en, /ms/…, /zh/…). */
export function allLanguageUrls(paths: string[]): string[] {
  const out = new Set<string>();
  for (const path of paths) {
    for (const locale of LOCALES) {
      const p = localePath(locale, path);
      out.add(`${SITE.url}${p === "/" ? "" : p}`);
    }
  }
  return [...out];
}

/** Sends the URLs to IndexNow. Only from the production deployment; never throws. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (process.env.VERCEL_ENV !== "production" || urls.length === 0) return;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE.url).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE.url}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10_000),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok && res.status !== 202) console.error(`IndexNow: HTTP ${res.status}`);
  } catch (e) {
    console.error("IndexNow unreachable:", (e as Error).message);
  }
}
