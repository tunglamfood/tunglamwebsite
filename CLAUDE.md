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
src/components/         layout/, product/, recipe/, forms/, ui/, seo/, brand/, admin/, reactbits/ (vendored React Bits, lint-ignored)
src/lib/                data.ts (queries), seo.ts (metadata + JSON-LD), i18n.ts, site.ts (company facts), supabase/, actions/
src/i18n/dictionaries/  en.ts (source of truth for keys), ms.ts, zh.ts
src/data/               legacy-redirects.json (generated)
supabase/migrations/    SQL schema + RLS
supabase/seed/          data/*.json (trilingual content) + media/ (WebP) — canonical content source
scripts/                seed.mjs, kie-image.mjs, qa.mjs
docs/                   SEO strategy, deployment, content review
```

## Admin panel
`/admin` — password-only (`ADMIN_PASSWORD`), HMAC-signed httpOnly session cookie (`src/lib/admin/session.ts`),
checked in `src/proxy.ts`, every admin page (`requireAdmin`) and every server action (`src/lib/admin/actions.ts`).
Separate root layout `src/app/admin/layout.tsx` (neutral `.admin-theme`, noindex). Saves call `updateTag("content")`.
**The admin is now the source of truth for content** — don't re-run `db:seed` (it refuses without `--force`).
Guides (`/guides`, table `guides`, Markdown subset rendered by `src/components/guide/guide-body.tsx`) are edited in /admin/guides.

## Auto posts (daily AI content)
`src/lib/auto-content/`: Vercel Cron (`vercel.json`, 09:00/13:00/17:00 MYT + a 20:00 sweep) calls `/api/auto-content/cron`,
which plans topics, writes one trilingual recipe or guide with OpenAI, checks it (`guards.ts` hard bans: non-halal, alcohol,
invented company facts, prices, shelf life, health claims; an AI editor; duplicate checks in `dedupe.ts`), then Kie makes the
photo and `/api/auto-content/kie` (signed callback) publishes it with `source='auto'`. Tables `auto_posts`, `auto_settings`.
Controlled in /admin/auto-posts (pause switch, write-now, topic queue). Needs `OPENAI_API_KEY`, `KIE_API_KEY`, `CRON_SECRET`.
Company facts the writer may use come only from `src/lib/site.ts` and the product table — keep both accurate.

## Dealer portal (/portal)
B2B ordering for dealers and sales reps. **All trading data lives in the ERP database** (project `ndmnbmctwebwscptvenu`,
repo `tunglamfood/tunglamerp`); this app only reads/writes it server-side (`src/lib/portal/erp.ts`, key `ERP_SUPABASE_SECRET_KEY`).
Prices, order numbers and order placement are ERP database functions (`sales_price_for`, `portal_catalog`,
`portal_place_order`, `portal_cancel_order`) — never compute money in this app. Login = phone + OTP
(`PORTAL_DEMO_OTP` for the demo; otherwise a real code by OneWay SMS, `src/lib/portal/otp.ts`). Session = signed cookie `tl_portal` (`src/lib/portal/session.ts`),
re-checked against `portal_accounts` on every request. Cart lives in localStorage per login+dealer.
Plan and phases: `docs/DEALER-PORTAL-PLAN.md`. Logins, catalogue grouping and reps are managed in the ERP → Sales → Dealer portal.

## Design system
Neutral canvas, near-black primary buttons, Tung Lam red as accent. Tokens in `src/app/globals.css` (`.admin-theme` overrides for /admin).
Site buttons: `buttonClass()` (`src/components/ui/button.tsx`); admin buttons/cards/badges/tables: `src/components/admin/ui.tsx`.
Phones get their own layouts (swipe rails via `ui/rail.tsx`, drawers, stacked rows), not shrunken desktop. Language links are plain
`<a>` on purpose (prefetching /ms or /zh breaks Next's route prediction for /about etc.).

## Commands
`npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint` · `npm run qa` · `npm run db:seed` · `npm run image:generate`

## Rules
- Skills in `.claude/skills/`: **tunglam-content** (editing content), **tunglam-seo** (any page/metadata change),
  **kie-image** (any image), **tunglam-qa** (verify before shipping), plus official supabase / vercel skills.
- Never invent company facts (certifications, shelf life, prices, delivery areas). Company facts live in `src/lib/site.ts`.
- Secrets live in `.env` (gitignored; the GitHub repo is public). Only `.env.example` is committed.
- Service-role key is server-only (`src/lib/supabase/admin.ts`). `inquiries` has no anon RLS policies — keep it that way.
- Every UI string goes into all three dictionaries.
- Git: after committing, always push to `origin` (`git@github-tunglamfood:tunglamfood/tunglamwebsite.git`, branch `main`).
  The `github-tunglamfood` SSH host alias uses `~/.ssh/tunglamfood_ed25519` (tunglamfood account). Don't use `gh` to push —
  it's logged in as an account with read-only access.
