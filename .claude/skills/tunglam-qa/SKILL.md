---
name: tunglam-qa
description: Verify the Tung Lam website works before shipping — typecheck, lint, production build, then automated checks for status codes, legacy redirects, SEO tags, hreflang, JSON-LD, mobile horizontal overflow and console errors, plus screenshots. Use after any code change, before committing/deploying, or when the user asks "does it work / check the site / test it".
---

# Tung Lam QA

```bash
npm run typecheck && npm run lint
npm run build
npx next start -p 3100            # run in background
npm run qa -- --base http://localhost:3100 --shots .qa   # .qa is gitignored
```

`scripts/qa.mjs` drives the locally installed **Microsoft Edge** via `playwright-core` (no browser download).
In Git Bash, prefix commands that pass URL paths as arguments with `MSYS_NO_PATHCONV=1`.

What it checks:
- 200 for all key routes in all locales, real 404 for unknown URLs, legacy `tunglamfood.com` paths redirect to the new URL
- product page: title/description length, canonical, hreflang (en-MY, ms-MY, zh-Hans-MY, x-default), JSON-LD, og:image, h1
- desktop 1440 / mobile 390: no horizontal overflow, no console or network errors
  (Vercel Analytics 404s are expected locally and ignored)

Then **look at the screenshots** (downscale big PNGs with PIL before reading) — automated checks don't catch ugly.

Enquiry form end-to-end: submit on `/products/<slug>#enquire` (wait >2s first: bot timer), confirm the row in
`inquiries` with the service role, then delete the test row. Anon must not be able to read or insert `inquiries`.

Known gotcha: `buttonClass(..., "hidden md:inline-flex")` doesn't hide (base `inline-flex` wins) — wrap in a
`<div className="hidden md:block">` instead.
