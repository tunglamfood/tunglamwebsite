"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALES, LOCALE_META, localePath, stripLocale, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? "/";
  const base = stripLocale(pathname);
  return (
    <details className="group relative">
      <summary
        className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-full border border-ink/10 bg-white/70 px-3 text-sm font-semibold text-ink-soft transition hover:border-ink/30 [&::-webkit-details-marker]:hidden"
        aria-label={label}
      >
        <Globe className="size-4" aria-hidden />
        {LOCALE_META[locale].short}
      </summary>
      <ul className="card absolute right-0 top-full z-50 mt-2 w-44 p-1.5">
        {LOCALES.map((l) => (
          <li key={l}>
            <Link
              href={localePath(l, base)}
              hrefLang={LOCALE_META[l].hreflang}
              lang={LOCALE_META[l].htmlLang}
              aria-current={l === locale ? "true" : undefined}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-cream aria-[current]:font-semibold aria-[current]:text-brand"
            >
              {LOCALE_META[l].label}
              <span className="text-xs text-muted">{LOCALE_META[l].short}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
