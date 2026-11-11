@AGENTS.md

# Tung Lam Food website — tunglamfood.my

Corporate + catalogue site for TUNG LAM FOOD INDUSTRIES SDN BHD (Menglembu, Perak; est. 1999), replacing the
NEWPAGES site at tunglamfood.com. Goal: a modern design and **better SEO than the old site**.

## Stack
- Next.js 16 App Router (Turbopack, `cacheComponents: false` → static generation + ISR), React 19, Tailwind v4, TypeScript
- Supabase (Postgres + Storage, region ap-southeast-1 Singapore) — content + enquiries
- Vercel, region `sin1` (`vercel.json`); domain tunglamfood.my (DNS at Exabytes)
- Images: Kie.ai GPT Image 2.6 at 1K for lifestyle imagery (`scripts/kie-image.mjs`)

## Layout
```
src/app/[lang]/...      pages (en at root via src/proxy.ts rewrite, /ms, /zh)
src/app/sitemap.ts, robots.ts, llms.txt/, manifest.ts, api/revalidate/
src/components/         layout/, product/, recipe/, forms/, ui/, seo/, brand/
src/lib/                data.ts (queries), seo.ts (metadata + JSON-LD), i18n.ts, site.ts (company facts), supabase/, actions/
src/i18n/dictionaries/  en.ts (source of truth for keys), ms.ts, zh.ts
src/data/               legacy-redirects.json (generated)
supabase/migrations/    SQL schema + RLS
supabase/seed/          data/*.json (trilingual content) + media/ (WebP) — canonical content source
scripts/                seed.mjs, kie-image.mjs, qa.mjs
docs/                   SEO strategy, deployment, content review
```

## Commands
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run qa` · `npm run db:seed` · `npm run image:generate`

## Rules
- Skills in `.claude/skills/`: **tunglam-content** (editing content), **tunglam-seo** (any page/metadata change),
  **kie-image** (any image), **tunglam-qa** (verify before shipping), plus official supabase / vercel skills.
- Never invent company facts (certifications, shelf life, prices, delivery areas). Company facts live in `src/lib/site.ts`.
- Secrets live in `.env` (gitignored; the GitHub repo is public). Only `.env.example` is committed.
- Service-role key is server-only (`src/lib/supabase/admin.ts`). `inquiries` has no anon RLS policies — keep it that way.
- Every UI string goes into all three dictionaries.
