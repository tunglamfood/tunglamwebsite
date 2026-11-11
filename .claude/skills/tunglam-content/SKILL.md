---
name: tunglam-content
description: Add, edit or remove Tung Lam Food website content — products, categories (series / product lines), brands, recipes, FAQs — in Supabase, in all three languages (en, ms, zh), then publish it. Use when the user asks to add a new product, change a description, price/pack size, image, recipe or FAQ, or says the site content is wrong or outdated.
---

# Tung Lam content workflow

Content lives in **Supabase** (project in `ap-southeast-1` Singapore) and is edited by the client in the
**admin panel at `/admin`** — that is now the source of truth. Prefer telling the user how to do it in the admin.
If you must change data programmatically, update rows directly (service role) and call `POST /api/revalidate`.
**Never re-run `npm run db:seed` on the live DB** — it overwrites admin edits and replaces all FAQs (it refuses without `--force`).
`supabase/seed/` is only the initial import.

## Data model (see `supabase/migrations/*_init.sql`)
- Every user-facing text field is `jsonb` `{ "en": "...", "ms": "...", "zh": "..." }`. List fields (highlights,
  serving_ideas, tips, keywords) are `{ "en": [..], "ms": [..], "zh": [..] }`.
- `categories`: 2 levels — series (`tofu-series`, `steamboat-series`, `dessert-series`) → product lines.
- Category slugs and product slugs share one URL namespace: `/products/<slug>`. **Never reuse a slug across both.**
- `products.images`: `[{ "path": "products/<slug>.webp", "width": 1000, "height": 1333 }]` (Supabase Storage bucket `media`).
- `inquiries` is write-only from the server action; anon has no access (RLS). Never add anon policies to it.

## Add or edit a product
1. Image: real packaging photo → WebP, max 1000px wide, saved as `supabase/seed/media/products/<slug>.webp`.
   Do **not** AI-generate packaging (it invents labels/Halal marks).
2. Add an entry to `supabase/seed/data/products.base.json` (slug, name, brand slug, category slug, net_weight,
   image, image_size, featured, sort, legacy fields null for new products).
3. Add the trilingual copy to `supabase/seed/data/products.content.json` keyed by slug:
   `name, short (≤160 chars), description (2–3 paragraphs, "\n\n"), highlights (3–4), serving_ideas (3–4), meta_title (≤60), meta_description (140–160)`.
4. `npm run db:seed` (or `npm run db:seed:data` if no new images).
5. Publish: `curl -X POST https://tunglamfood.my/api/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"`
   (pages also refresh on their own within 1 hour).

## Writing rules (important — accuracy is a brand/legal risk)
- Never invent facts: no shelf life, storage temperatures, ingredients, nutrition, prices, MOQs, delivery areas,
  export markets, awards or customer counts unless the user supplies them. Storage line: "Keep chilled or frozen as indicated on the pack."
- Halal: "Halal-certified manufacturer" — don't name the certifying body unless confirmed.
- Malay must be Malaysian Bahasa (not Indonesian). Chinese is Simplified, Malaysian usage (豆卜, 潮州豆干, 煎蕊).
  The company's Chinese name printed on packs is 東臨食品工業有限公司 (东临食品).
- Variants (e.g. 2/4/6/10 pcs) need distinct copy — differentiate by pack size and use case (household vs food service).
- Recipes must stay Halal-friendly (no pork, no alcohol).

## Removing a product
Prefer `is_published = false` over deleting (keeps the legacy redirect target valid). If deleted, update
`src/data/legacy-redirects.json` via `npm run db:seed` so old URLs still land somewhere sensible.
