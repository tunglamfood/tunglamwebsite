export const LOCALES = ["en", "ms", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export type L10n<T = string> = Partial<Record<Locale, T>>;

/** BCP-47 tags used for <html lang>, hreflang and og:locale. */
export const LOCALE_META: Record<Locale, { hreflang: string; htmlLang: string; og: string; label: string; short: string }> = {
  en: { hreflang: "en-MY", htmlLang: "en-MY", og: "en_MY", label: "English", short: "EN" },
  ms: { hreflang: "ms-MY", htmlLang: "ms-MY", og: "ms_MY", label: "Bahasa Melayu", short: "BM" },
  zh: { hreflang: "zh-Hans-MY", htmlLang: "zh-Hans-MY", og: "zh_MY", label: "简体中文", short: "中文" },
};

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Pick a localized value with English fallback. */
export function t<T>(value: L10n<T> | null | undefined, locale: Locale): T | undefined {
  if (!value) return undefined;
  return value[locale] ?? value.en;
}

/** Prefix an internal path with the locale. English lives at the root (no prefix). */
export function localePath(locale: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

/** Replace {placeholders} in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Strip a leading locale segment from a pathname: "/ms/products" -> "/products". */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/(en|ms|zh)(?=\/|$)/);
  const rest = m ? pathname.slice(m[0].length) : pathname;
  return rest === "" ? "/" : rest;
}
