import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, type Locale } from "@/lib/i18n";
import { buttonClass } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNav } from "./mobile-nav";
import { DesktopNav } from "./desktop-nav";
import { LogoLink } from "./logo-link";
import { buildNav } from "./nav";
import { SITE, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";

export function SiteHeader({ locale, dict, series }: { locale: Locale; dict: Dictionary; series: Category[] }) {
  const nav = buildNav(locale, dict, series);
  return (
    <>
      {/* Announcement bar (tablet and up; phones keep the header compact). */}
      <div className="hidden bg-ink text-white/75 sm:block">
        <div className="container-x flex h-9 items-center justify-between gap-6 text-xs font-medium">
          <p className="inline-flex min-w-0 items-center gap-2 truncate">
            <ShieldCheck className="size-3.5 shrink-0 text-sun" aria-hidden />
            {dict.home.announce}
          </p>
          <a href={whatsappLink()} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-1.5 text-white transition-colors hover:text-sun">
            <WhatsAppIcon className="size-3.5 shrink-0" /> {SITE.phoneDisplay}
          </a>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-line/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="container-x flex h-16 items-center gap-4 lg:h-[4.5rem] lg:gap-6">
          <LogoLink href={localePath(locale)} label="Tung Lam Food — home" className="shrink-0">
            <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} priority className="h-9 w-auto lg:h-11" />
          </LogoLink>

          <DesktopNav items={nav} />

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <LanguageSwitcher locale={locale} label={dict.nav.language} />
            <div className="hidden lg:block">
              <Link href={localePath(locale, "/wholesale")} className={buttonClass("primary", "sm")}>
                {dict.cta.wholesale}
              </Link>
            </div>
            <MobileNav
              items={nav}
              locale={locale}
              menuLabel={dict.nav.menu}
              closeLabel={dict.nav.close}
              ctaLabel={dict.cta.wholesale}
              whatsappLabel={dict.cta.whatsapp}
              languageLabel={dict.nav.language}
            />
          </div>
        </div>
      </header>
    </>
  );
}
