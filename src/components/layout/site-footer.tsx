import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import { SITE, fullAddress, whatsappLink } from "@/lib/site";
import { CertBadges } from "@/components/ui/cert-badges";
import { WhatsAppIcon } from "@/components/ui/icons";

const linkClass = "text-white/65 transition-colors hover:text-white";
const headClass = "mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/45";

export function SiteFooter({ locale, dict, series }: { locale: Locale; dict: Dictionary; series: Category[] }) {
  const p = (path: string) => localePath(locale, path);
  const year = new Date().getFullYear();
  const explore = [
    ...series.map((s) => ({ href: p(`/products/${s.slug}`), label: t(s.name, locale) ?? s.slug })),
    { href: p("/products"), label: dict.nav.allProducts },
    { href: p("/brands"), label: dict.nav.brands },
    { href: p("/recipes"), label: dict.nav.recipes },
    { href: p("/guides"), label: dict.nav.guides },
  ];
  const company = [
    { href: p("/about"), label: dict.nav.about },
    { href: p("/wholesale"), label: dict.nav.wholesale },
    { href: p("/faq"), label: dict.nav.faq },
    { href: p("/careers"), label: dict.nav.careers },
    { href: p("/contact"), label: dict.nav.contact },
    { href: p("/privacy"), label: dict.nav.privacy },
  ];

  return (
    <footer className="mt-16 bg-ink text-white sm:mt-24">
      <div className="container-x py-10 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr_1fr_1.35fr] lg:gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <div className="inline-flex rounded-xl bg-white px-3.5 py-2.5">
              <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-10 w-auto sm:h-11" />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-white/65">{dict.footer.tagline}</p>
            <CertBadges className="gap-2" size={40} tone="dark" />
          </div>

          {/* Links: two columns side by side on phones */}
          <div className="grid grid-cols-2 gap-6 lg:contents">
            <div>
              <h2 className={headClass}>{dict.footer.explore}</h2>
              <ul className="space-y-2.5 text-sm">
                {explore.map((l) => (
                  <li key={l.href}>
                    <Link className={linkClass} href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className={headClass}>{dict.footer.company}</h2>
              <ul className="space-y-2.5 text-sm">
                {company.map((l) => (
                  <li key={l.href}>
                    <Link className={linkClass} href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className={headClass}>{dict.footer.getInTouch}</h2>
            {/* Phones: big tap targets */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {[
                { href: `tel:${SITE.phone}`, icon: Phone, label: dict.cta.callUs },
                { href: whatsappLink(), icon: WhatsAppIcon, label: "WhatsApp" },
                { href: SITE.mapsUrl, icon: Navigation, label: dict.cta.getDirections },
              ].map((a) => (
                <a
                  key={a.label}
                  href={a.href}
                  {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center text-xs font-medium text-white/85 active:bg-white/10"
                >
                  <a.icon className="size-5" aria-hidden />
                  {a.label}
                </a>
              ))}
            </div>
            <address className="mt-5 space-y-3.5 text-sm not-italic sm:mt-0">
              <a href={SITE.mapsUrl} target="_blank" rel="noopener" className={`flex gap-3 ${linkClass}`}>
                <MapPin className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />
                <span>{fullAddress}</span>
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener" className={`hidden gap-3 sm:flex ${linkClass}`}>
                <Phone className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />
                <span>{SITE.phoneDisplay}</span>
              </a>
              <a href={`mailto:${SITE.email}`} className={`flex gap-3 ${linkClass}`}>
                <Mail className="mt-0.5 size-4 shrink-0 text-white/40" aria-hidden />
                <span className="break-all">{SITE.email}</span>
              </a>
            </address>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-1.5 py-6 pb-20 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
          <p>
            © {SITE.foundingYear}–{year} {SITE.legalName} · {SITE.registrationNo}. {dict.footer.rights}
          </p>
          <p>Menglembu · Perak · Malaysia</p>
        </div>
      </div>
    </footer>
  );
}
