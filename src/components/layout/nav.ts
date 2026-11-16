import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import { seriesImageSrc } from "@/components/brand/brand-logos";

export type NavChild = { href: string; label: string; description?: string; image?: string; icon?: "recipes" | "guides" };
export type NavItem = {
  href: string;
  label: string;
  /** "mega": product series with images; "list": simple dropdown. */
  menu?: "mega" | "list";
  children?: NavChild[];
  /** For "mega" menus: the "see everything" link shown as a feature card. */
  all?: { href: string; label: string; image: string };
};

export function buildNav(locale: Locale, d: Dictionary, series: Category[]): NavItem[] {
  const p = (path: string) => localePath(locale, path);
  return [
    {
      href: p("/products"),
      label: d.nav.products,
      menu: "mega",
      children: series.map((s) => ({
        href: p(`/products/${s.slug}`),
        label: t(s.name, locale) ?? s.slug,
        description: t(s.tagline, locale),
        image: seriesImageSrc(s),
      })),
      all: { href: p("/products"), label: d.nav.allProducts, image: "/images/hero.webp" },
    },
    { href: p("/brands"), label: d.nav.brands },
    {
      href: p("/recipes"),
      label: d.nav.recipes,
      menu: "list",
      children: [
        { href: p("/recipes"), label: d.recipes.title, description: d.recipes.intro, icon: "recipes" },
        { href: p("/guides"), label: d.nav.guides, description: d.guides.intro, icon: "guides" },
      ],
    },
    { href: p("/wholesale"), label: d.nav.wholesale },
    { href: p("/about"), label: d.nav.about },
    { href: p("/contact"), label: d.nav.contact },
  ];
}

/** True when `pathname` is `href` or below it (the home link only matches itself). */
export function isActive(pathname: string, href: string) {
  if (href === "/" || /^\/(ms|zh)$/.test(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
