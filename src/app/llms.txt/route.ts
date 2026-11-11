import { getCatalog, getRecipes } from "@/lib/data";
import { t } from "@/lib/i18n";
import { SITE, fullAddress } from "@/lib/site";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** llms.txt — a plain-text summary of the site for AI assistants and answer engines. */
export async function GET() {
  const [{ series, linesOf, productsIn, brands }, recipes] = await Promise.all([getCatalog(), getRecipes()]);
  const lines: string[] = [
    `# ${SITE.legalName} (Tung Lam Food)`,
    "",
    `> Halal-certified chilled and frozen food manufacturer in Menglembu, Perak, Malaysia, established ${SITE.foundingYear}. Makes tofu, egg tofu, silken tofu, tofu puffs (tofu goreng), firm tofu (taufu keras), fish balls, fish cakes, fish paste, peeled quail eggs, cincau (grass jelly) and cendol under the brands ${brands.map((b) => b.name).join(", ")}. Supplies households, retailers, wet markets, hawkers, restaurants and distributors in Malaysia. Certifications shown: Halal, HACCP, GMP, MeSTI.`,
    "",
    `- Address: ${fullAddress}`,
    `- Phone / WhatsApp: ${SITE.phoneDisplay}`,
    `- Email: ${SITE.email}`,
    `- Company no.: ${SITE.registrationNo}`,
    `- Languages: English (${SITE.url}), Bahasa Melayu (${SITE.url}/ms), 简体中文 (${SITE.url}/zh)`,
    "",
    "## Key pages",
    `- [All products](${absoluteUrl("/products")})`,
    `- [Wholesale & food service](${absoluteUrl("/wholesale")})`,
    `- [Brands](${absoluteUrl("/brands")})`,
    `- [Recipes](${absoluteUrl("/recipes")})`,
    `- [About](${absoluteUrl("/about")})`,
    `- [FAQ](${absoluteUrl("/faq")})`,
    `- [Contact](${absoluteUrl("/contact")})`,
    "",
  ];
  for (const s of series) {
    lines.push(`## ${t(s.name, "en")}`, `${t(s.tagline, "en") ?? ""}`, "");
    for (const c of linesOf(s.id)) {
      lines.push(`### [${t(c.name, "en")}](${absoluteUrl(`/products/${c.slug}`)})`);
      for (const p of productsIn(c)) {
        lines.push(`- [${t(p.name, "en")}](${absoluteUrl(`/products/${p.slug}`)})${p.net_weight ? ` — ${p.net_weight}` : ""}: ${t(p.short, "en") ?? ""}`);
      }
      lines.push("");
    }
  }
  lines.push("## Recipes");
  for (const r of recipes) lines.push(`- [${t(r.title, "en")}](${absoluteUrl(`/recipes/${r.slug}`)}): ${t(r.excerpt, "en") ?? ""}`);
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
