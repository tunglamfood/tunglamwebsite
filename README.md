# Tung Lam Food — tunglamfood.my

The website of **TUNG LAM FOOD INDUSTRIES SDN BHD**, a Halal-certified chilled and frozen food manufacturer based in Menglembu, Perak, since 1999.

It covers 44 products across the Tung Lam, Sakura, Cili and AD brands, plus recipes and wholesale enquiries. The site is in three languages: English (at `/`), Bahasa Melayu (at `/ms`) and 简体中文 (at `/zh`).

**Stack:** Next.js 16 · Tailwind v4 · Supabase (Singapore) · Vercel (`sin1`)

## Getting started

```bash
cp .env.example .env    # fill in the keys
npm install
npm run dev             # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Run the Next.js dev server, production build or production server |
| `npm run typecheck` / `lint` | Run the TypeScript and ESLint checks |
| `npm run db:seed` | Upload images and upsert all content from `supabase/seed/` into Supabase, then regenerate the legacy redirects |
| `npm run db:seed:data` | Same as `db:seed`, but skips the image upload |
| `npm run image:generate -- --out x.png --aspect 16:9 --prompt "..."` | Generate an image with Kie.ai (GPT Image 2.6, 1K) |
| `npm run qa -- --base http://localhost:3100` | Check status codes, redirects, SEO tags and mobile layout |

## Updating content

1. Edit the files in `supabase/seed/data/` (each text field holds `en`, `ms` and `zh`).
2. Run `npm run db:seed`.
3. Trigger a revalidation, or wait up to 1 hour for pages to refresh on their own:

```bash
curl -X POST https://tunglamfood.my/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
```

## More documentation

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Vercel, the domain (Exabytes DNS), environment variables, and moving off the old domain
- [docs/SEO-STRATEGY.md](docs/SEO-STRATEGY.md): how this site compares to the old NEWPAGES site, and what to do after launch
- [docs/CONTENT-REVIEW.md](docs/CONTENT-REVIEW.md): facts the company needs to confirm before launch
- `.claude/skills/`: working guides for Claude Code
