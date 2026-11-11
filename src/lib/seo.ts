import type { Metadata } from "next";
import { LOCALES, LOCALE_META, localePath, type Locale } from "@/lib/i18n";
import { SITE, fullAddress } from "@/lib/site";

export const absoluteUrl = (path = "/") => `${SITE.url}${path === "/" ? "" : path}`;

/** hreflang map for a locale-agnostic path, e.g. "/products/egg-tofu". */
export function languageAlternates(path: string) {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[LOCALE_META[l].hreflang] = absoluteUrl(localePath(l, path));
  languages["x-default"] = absoluteUrl(localePath("en", path));
  return languages;
}

type PageMetaInput = {
  locale: Locale;
  /** Locale-agnostic path ("/", "/products/egg-tofu"). */
  path: string;
  title: string;
  description: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  type?: "website" | "article";
  /** Use the title verbatim instead of the "%s | Tung Lam Food" template. */
  absoluteTitle?: boolean;
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

export function pageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(localePath(input.locale, input.path));
  const image = input.image ?? { url: absoluteUrl("/og-default.jpg"), width: 1200, height: 630, alt: SITE.name };
  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: { canonical: url, languages: languageAlternates(input.path) },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: SITE.name,
      title: input.title,
      description: input.description,
      locale: LOCALE_META[input.locale].og,
      alternateLocale: LOCALES.filter((l) => l !== input.locale).map((l) => LOCALE_META[l].og),
      images: [image],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: input.title, description: input.description, images: [image.url] },
    robots: input.noindex ? { index: false, follow: true } : undefined,
  };
}

// ---------------------------------------------------------------------------
// JSON-LD builders (schema.org)
// ---------------------------------------------------------------------------
export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export function organizationJsonLd(description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": ORG_ID,
        name: SITE.legalName,
        // Chinese name as printed on product packaging.
        alternateName: ["Tung Lam Food", "Tung Lam", "東臨食品工業有限公司", "东临食品"],
        url: SITE.url,
        logo: { "@type": "ImageObject", url: absoluteUrl("/icon.png"), width: 512, height: 512 },
        image: absoluteUrl("/og-default.jpg"),
        description,
        foundingDate: String(SITE.foundingYear),
        taxID: SITE.registrationNo,
        email: SITE.email,
        telephone: SITE.phone,
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.locality,
          addressRegion: SITE.address.region,
          postalCode: SITE.address.postalCode,
          addressCountry: SITE.address.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
        hasMap: SITE.mapsUrl,
        areaServed: { "@type": "Country", name: "Malaysia" },
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: SITE.phone,
            email: SITE.email,
            areaServed: "MY",
            availableLanguage: ["English", "Malay", "Chinese"],
          },
        ],
        sameAs: [SITE.legacyDomain],
        knowsAbout: ["Tofu", "Egg tofu", "Tofu puffs", "Fish balls", "Fish cakes", "Fish paste", "Quail eggs", "Cincau", "Cendol", "Steamboat ingredients"],
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": ORG_ID },
        inLanguage: LOCALES.map((l) => LOCALE_META[l].hreflang),
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.url) })),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListJsonLd(items: { name: string; url: string; image?: string | null }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(it.url),
      name: it.name,
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}

export { fullAddress };
