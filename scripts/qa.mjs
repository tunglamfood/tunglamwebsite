#!/usr/bin/env node
/**
 * Site QA against a running server (default http://localhost:3000):
 *  - HTTP status of key routes, 404s and legacy (tunglamfood.com) redirects
 *  - SEO tags on a product page (title, canonical, hreflang, JSON-LD)
 *  - Desktop (1440) + mobile (390) render: horizontal overflow, console/network errors
 *  - Optional full-page screenshots with --shots <dir>
 *
 *   npm run build && npm start            # in one terminal
 *   npm run qa -- --base http://localhost:3000 [--shots ./.qa]
 *
 * Uses the locally installed Microsoft Edge (or Chrome with --channel chrome) via playwright-core.
 */
import { parseArgs } from "node:util";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";

const { values: o } = parseArgs({
  options: { base: { type: "string", default: "http://localhost:3000" }, shots: { type: "string" }, channel: { type: "string", default: "msedge" } },
});
const BASE = o.base.replace(/\/$/, "");
let failures = 0;
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`); };
const pass = (msg) => console.log(`  ✓ ${msg}`);

// ------------------------------------------------------------------ HTTP
console.log("HTTP status");
const expect200 = ["/", "/ms", "/zh", "/products", "/products/tofu-series", "/products/egg-tofu", "/products/tl-egg-tofu-130gm",
  "/zh/products/ad-fish-ball-450gm", "/brands", "/brands/sakura", "/recipes", "/recipes/cendol-dessert", "/about", "/wholesale",
  "/contact", "/faq", "/careers", "/privacy", "/sitemap.xml", "/robots.txt", "/llms.txt"];
for (const p of expect200) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  if (r.status === 200) pass(`${r.status} ${p}`);
  else fail(`${r.status} ${p} (expected 200)`);
}
for (const p of ["/does-not-exist", "/products/nope"]) {
  const r = await fetch(BASE + p, { redirect: "manual" });
  if (r.status === 404) pass(`404 ${p}`);
  else fail(`${r.status} ${p} (expected 404)`);
}
const legacy = {
  "/showproducts/productid/4551183/cid/476078/tl-egg-tofu-130gm/": "/products/tl-egg-tofu-130gm",
  "/ourproducts/cid/476125/cat/tofu-series-tofu-goreng-series-tung-lam/": "/products/tofu-puffs",
  "/latestnews/nid/129625/": "/recipes/cendol-dessert",
  "/contactus/": "/contact",
  "/en/products": "/products",
};
for (const [from, to] of Object.entries(legacy)) {
  const r = await fetch(BASE + from);
  const final = new URL(r.url).pathname;
  if (final === to && r.status === 200) pass(`${from} → ${to}`);
  else fail(`${from} → ${final} (${r.status}), expected ${to}`);
}

// ------------------------------------------------------------------ SEO
console.log("SEO tags (product page)");
{
  const h = await (await fetch(BASE + "/products/tl-egg-tofu-130gm")).text();
  const has = (re, label) => {
    if (re.test(h)) pass(label);
    else fail(`missing ${label}`);
  };
  has(/<title>[^<]{10,70}<\/title>/, "title (10–70 chars)");
  has(/name="description" content="[^"]{70,170}"/, "meta description (70–170 chars)");
  has(/rel="canonical"/, "canonical");
  for (const l of ["en-MY", "ms-MY", "zh-Hans-MY", "x-default"]) has(new RegExp(`hrefLang="${l}"`, "i"), `hreflang ${l}`);
  for (const t of ["Product", "BreadcrumbList", "Organization"]) has(new RegExp(`"@type":(\\[[^\\]]*)?"${t}"`), `JSON-LD ${t}`);
  has(/property="og:image"/, "og:image");
  has(/<h1[^>]*>/, "h1");
}

// ------------------------------------------------------------------ Render
console.log("Render (overflow / errors)");
const pages = ["/", "/zh", "/ms/products", "/products/tofu-series", "/products/tl-egg-tofu-130gm", "/recipes/cendol-dessert", "/about", "/wholesale", "/contact", "/faq"];
const browser = await chromium.launch({ channel: o.channel, headless: true });
if (o.shots) await mkdir(o.shots, { recursive: true });
for (const [name, opts] of [
  ["desktop", { viewport: { width: 1440, height: 900 } }],
  ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  for (const p of pages) {
    errors.length = 0;
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
      window.scrollTo(0, 0);
    });
    await page.waitForLoadState("networkidle");
    const { sw, vw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, vw: document.documentElement.clientWidth }));
    // Vercel Analytics scripts only exist on Vercel; ignore them locally.
    const real = errors.filter((e) => !/_vercel\/(insights|speed-insights)|MIME type|Failed to load resource/.test(e));
    if (sw > vw) fail(`${name} ${p}: horizontal overflow (${sw} > ${vw})`);
    else if (real.length) fail(`${name} ${p}: ${real.slice(0, 2).join(" ; ")}`);
    else pass(`${name} ${p}`);
    if (o.shots) await page.screenshot({ path: `${o.shots}/${name}${p.replace(/[^a-z0-9]+/gi, "_") || "_home"}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
