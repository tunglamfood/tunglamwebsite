// Submits every URL in the live sitemap to IndexNow (Bing, Yandex, Seznam, Naver).
// Usage: npm run seo:indexnow [-- --site https://tunglamfood.my]
// Run after a big content change or a redesign; normal admin saves submit their own pages.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { site: { type: "string", default: "https://tunglamfood.my" } } });
const site = values.site.replace(/\/$/, "");
const key = /INDEXNOW_KEY = "([0-9a-f]+)"/.exec(readFileSync(new URL("../src/lib/indexnow.ts", import.meta.url), "utf8"))[1];

const keyFile = await fetch(`${site}/${key}.txt`);
if (!keyFile.ok || (await keyFile.text()).trim() !== key) throw new Error(`Key file ${site}/${key}.txt is not live yet — deploy first.`);

const xml = await (await fetch(`${site}/sitemap.xml`)).text();
const urls = [...new Set([...xml.matchAll(/<(?:loc|xhtml:link[^>]*href=")([^<"]+)/g)].map((m) => m[1].replace(/^>/, "")))]
  .filter((u) => u.startsWith(site));
if (urls.length === 0) throw new Error("No URLs found in the sitemap.");

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${res.status} ${res.status === 200 || res.status === 202 ? "(accepted)" : await res.text()}`);
