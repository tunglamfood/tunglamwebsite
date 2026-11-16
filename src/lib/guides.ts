import type { Guide } from "@/lib/data";

/**
 * Guides: evergreen, trilingual articles at /guides/[slug] that answer what people
 * search for ("types of tofu", "tau pok", "cara simpan tauhu"…) and link to products.
 *
 * Rows live in the `guides` table (edited in /admin/guides; the auto-content pipeline
 * adds more). Body text is a small Markdown subset rendered by <GuideBody>:
 * `## Heading {#id}`, `### Sub`, paragraphs, `- ` and `1. ` lists, `| tables |`,
 * `> tip`, `**bold**` and `[text](/path)` links (internal paths without a locale prefix).
 */

/** Guides to link from a category or product page: its own category first, then its series. */
export function guidesFor(guides: Guide[], categorySlugs: (string | undefined)[], limit = 3): Guide[] {
  const out: Guide[] = [];
  for (const slug of categorySlugs) {
    if (!slug) continue;
    for (const g of guides) if (g.category_slugs.includes(slug) && !out.includes(g)) out.push(g);
  }
  return out.slice(0, limit);
}
