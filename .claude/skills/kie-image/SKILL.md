---
name: kie-image
description: Generate or edit images for the Tung Lam website with Kie.ai using the OpenAI GPT Image 2.6 model at 1K resolution — hero banners, lifestyle/food photography, category imagery, social/OG images, logo explorations. Use whenever the user asks for a new image, banner, photo, illustration, or to "rebuild"/improve an image.
---

# Kie image generation (GPT Image 2.6, 1K)

The user's standing preference: **Kie.ai, model GPT Image 2.6 ("flare"), resolution 1K.**

## Command
```bash
npm run image:generate -- --out <path.png> --aspect 16:9 --prompt "<prompt>"
# image-to-image / edit with references (public URLs, up to 16):
npm run image:generate -- --out <path.png> --aspect 4:5 --ref https://... --prompt "<edit instruction>"
```
Script: `scripts/kie-image.mjs` → `POST https://api.kie.ai/api/v1/jobs/createTask` with model
`gpt-image-2-6/flare-text-to-image` (or `...-image-to-image` when `--ref` is given), `input.resolution: "1K"`,
then polls `GET /api/v1/jobs/recordInfo?taskId=` until `state === "success"` and downloads `resultJson.resultUrls[0]`.
A task usually takes 1–9 minutes and costs ~6–9 credits. Run several in parallel in the background.

Transparent cut-outs (floating food decorations in `public/images/cut/`): add `--background transparent` and prompt for an isolated single subject; trim + save as 640px WebP.

Aspect ratios: `1:1, 3:2, 2:3, 4:3, 3:4, 4:5, 5:4, 16:9, 9:16, 21:9, ...`. Hero = 16:9, series cards = 4:5,
story/about = 3:2.

## House style (append to prompts)
"Editorial food photography for a premium Malaysian food brand, soft natural daylight, warm neutral stone and linen
surfaces, appetising true-to-life colours, shallow depth of field. No text, no logos, no packaging, no people's faces."
Leave negative space on one side when text will overlay it.

## Rules
- **Never** generate or "rebuild" product packaging shots — AI invents label text, Halal marks and nutrition panels.
  Product images must be real photos (clean up crop/background only).
- Don't depict a specific "Tung Lam factory" as if real; generic kitchen/craft scenes are fine.
- Logo: keep the official TL logo (`public/brand/logo.webp`). Only explore logo ideas when explicitly asked, and
  present them as concepts.
- After generating: convert to WebP (quality ~82, max 1600px) and save to `public/images/` (site design imagery) or
  `supabase/seed/media/` (CMS content). Review the image visually before using it.
