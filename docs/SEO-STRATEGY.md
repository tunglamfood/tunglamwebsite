# SEO strategy: tunglamfood.my compared with the old NEWPAGES site

## How the old site (tunglamfood.com) is built

The old site runs on NEWPAGES' shared PHP platform, served from Apache. I audited it in November 2026.

| Area | What the old site does | Problem |
| --- | --- | --- |
| Titles | `"{Product} Perak, Malaysia Fish Cake, Tofu \| TUNG LAM FOOD INDUSTRIES SDN BHD"` on every page | Keyword-stuffed and too long, so Google truncates or rewrites them |
| Descriptions | The product name followed by the same company paragraph on every page | Near-duplicate across all 44 products |
| Product copy | One generic "frozen food manufacturer…" paragraph reused across products | Thin, duplicate content with no buying help |
| Tag pages | 91 `/tag/...` pages with names like `#culimarymasterpiece` | Thin pages that dilute crawl budget |
| URLs | `/showproducts/productid/4551183/cid/476078/tl-egg-tofu-130gm/`, with two URL variants per product | Long URLs and duplicate paths |
| Structured data | `LocalBusiness`, and `Product` with an `Offer` that has no price | The Offer is invalid for rich results; no Breadcrumb, FAQ or Recipe markup |
| Languages | English only | Misses Bahasa Malaysia and Chinese searches (taufu goreng, 鱼丸, 豆卜) |
| Performance | No-cache headers, a PHP session cookie, jQuery and Bootstrap | Slower Core Web Vitals |
| Recipes | A "News" section with plain HTML | No Recipe markup, so no rich results |
| Bots | Serves different HTML depending on User-Agent (a "Checking your browser" page) | Risky. It can look like cloaking, and it blocks some crawlers |

The old site's real strengths are domain age and its NEWPAGES directory backlinks. We keep that value by 301-redirecting every old URL to its new page (see [DEPLOYMENT.md](DEPLOYMENT.md#3-moving-off-the-old-domain-tunglamfoodcom)).

## What the new site does better

1. **Unique, useful copy for every product, category and brand.** Each page has its own description, highlights, serving ideas and FAQs.
2. **Three languages (en, ms, zh)** with correct `hreflang` tags (`en-MY`, `ms-MY`, `zh-Hans-MY`, `x-default`) and `<html lang>`. That roughly triples the indexable, relevant pages, to 260, with no duplicate content.
3. **Clean URLs:** `/products/tl-egg-tofu-130gm`, `/products/egg-tofu`, `/recipes/cendol-dessert`. Each page has a single canonical URL, and explicit `/en/...` paths 308-redirect to the unprefixed version.
4. **Complete structured data:**
   - Organization and LocalBusiness, with the address, geo-coordinates, contact point and the Chinese name 東臨食品工業有限公司
   - WebSite and BreadcrumbList
   - Product, with brand, category, manufacturer and net weight (no fake Offer)
   - Recipe, with ingredients, steps, times and yield, which makes recipes eligible for rich results
   - FAQPage on the FAQ and category pages
   - ItemList on listing pages, and Brand on brand pages
5. **Speed:**
   - Pages are pre-built at build time and refreshed at most hourly from the Vercel edge.
   - Images are served as AVIF or WebP through `next/image`.
   - Fonts are self-hosted through `next/font`, so they don't cause layout shift.
   - Very little JavaScript runs in the browser.
   - Hosting and database are both in Singapore, close to Malaysian users.
6. **No thin pages.** The tag pages are dropped and their URLs 301 to `/products`.
7. **New pages aimed at buyers:** `/wholesale` (B2B searches such as "fish ball supplier Perak") and topical category landing pages.
8. **Answer engines:** `/llms.txt` gives AI assistants a summary of the catalogue. Content is factual and clearly structured.
9. **Technical hygiene:**
   - An XML sitemap that includes image entries and hreflang alternates
   - `robots.txt`, with indexing blocked on preview deployments
   - Security headers and HTTPS with HSTS
   - A real 404 status for unknown URLs
   - Images carry descriptive alt text

## What to do after launch

- [ ] Verify the site in Google Search Console and Bing Webmaster Tools, and submit the sitemap.
- [ ] Use the Change of Address tool, and set up 301s from tunglamfood.com. **This is the single most important step.**
- [ ] Update the Google Business Profile website link. Ask for reviews from B2B customers.
- [ ] Update the NEWPAGES directory listing and any distributor or supplier listings to link to tunglamfood.my.
- [ ] Publish one or two recipes or articles a month, for example "how to store tofu" or "steamboat ingredients list". Recipes with Recipe schema reliably earn rich results.
- [ ] Add real photos (factory, team, delivery) to the About and Wholesale pages to strengthen E-E-A-T.
- [ ] Track Core Web Vitals in Vercel Speed Insights, and rankings and clicks in Search Console.
