import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";

export type NavItem = { href: string; label: string; children?: { href: string; label: string; description?: string }[] };

export function buildNav(locale: Locale, d: Dictionary, series: Category[]): NavItem[] {
  const p = (path: string) => localePath(locale, path);
  return [
    {
      href: p("/products"),
      label: d.nav.products,
      children: [
        ...series.map((s) => ({ href: p(`/products/${s.slug}`), label: t(s.name, locale) ?? s.slug, description: t(s.tagline, locale) })),
        { href: p("/products"), label: d.nav.allProducts },
      ],
    },
    { href: p("/brands"), label: d.nav.brands },
    { href: p("/recipes"), label: d.nav.recipes },
    { href: p("/wholesale"), label: d.nav.wholesale },
    { href: p("/about"), label: d.nav.about },
    { href: p("/contact"), label: d.nav.contact },
  ];
}
