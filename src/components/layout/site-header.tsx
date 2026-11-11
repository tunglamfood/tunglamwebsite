import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, type Locale } from "@/lib/i18n";
import { buttonClass } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { buildNav } from "./nav";

export function SiteHeader({ locale, dict, series }: { locale: Locale; dict: Dictionary; series: Category[] }) {
  const nav = buildNav(locale, dict, series);
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/70">
      <div className="container-x flex h-[4.5rem] items-center gap-6">
        <Link href={localePath(locale)} className="shrink-0" aria-label="Tung Lam Food — home">
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} priority className="h-11 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 items-center justify-center lg:flex">
          <ul className="flex items-center gap-1">
            {nav.map((item) =>
              item.children ? (
                <li key={item.href} className="group relative">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.95rem] font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
                  >
                    {item.label}
                    <ChevronDown className="size-4 transition group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
                  </Link>
                  <div className="invisible absolute left-1/2 top-full w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    <ul className="card overflow-hidden p-2">
                      {item.children.map((c) => (
                        <li key={c.href + c.label}>
                          <Link href={c.href} className="block rounded-xl px-4 py-3 transition hover:bg-cream">
                            <span className="block font-semibold text-ink">{c.label}</span>
                            {c.description && <span className="mt-0.5 block text-sm text-muted">{c.description}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-full px-3.5 py-2 text-[0.95rem] font-medium text-ink-soft transition hover:bg-sand hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
          <div className="hidden md:block">
            <Link href={localePath(locale, "/wholesale")} className={buttonClass("primary", "sm")}>
              {dict.cta.wholesale}
            </Link>
          </div>
          <MobileNav items={nav} locale={locale} menuLabel={dict.nav.menu} closeLabel={dict.nav.close} ctaLabel={dict.cta.wholesale} />
        </div>
      </div>
    </header>
  );
}
