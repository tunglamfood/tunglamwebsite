import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import { SITE, fullAddress, whatsappLink } from "@/lib/site";
import { CertBadges } from "@/components/ui/cert-badges";

export function SiteFooter({ locale, dict, series }: { locale: Locale; dict: Dictionary; series: Category[] }) {
  const p = (path: string) => localePath(locale, path);
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 sm:mt-24">
      <div className="bg-ink text-white/80">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:py-16 md:gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 space-y-5 md:col-span-1">
          <div className="inline-flex rounded-2xl bg-white px-4 py-3">
            <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-12 w-auto" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed">{dict.footer.tagline}</p>
          <CertBadges className="gap-2" size={44} tone="dark" />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{dict.footer.explore}</h2>
          <ul className="space-y-2.5 text-sm">
            {series.map((s) => (
              <li key={s.slug}>
                <Link className="hover:text-white" href={p(`/products/${s.slug}`)}>
                  {t(s.name, locale)}
                </Link>
              </li>
            ))}
            <li><Link className="hover:text-white" href={p("/products")}>{dict.nav.allProducts}</Link></li>
            <li><Link className="hover:text-white" href={p("/brands")}>{dict.nav.brands}</Link></li>
            <li><Link className="hover:text-white" href={p("/recipes")}>{dict.nav.recipes}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{dict.footer.company}</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link className="hover:text-white" href={p("/about")}>{dict.nav.about}</Link></li>
            <li><Link className="hover:text-white" href={p("/wholesale")}>{dict.nav.wholesale}</Link></li>
            <li><Link className="hover:text-white" href={p("/faq")}>{dict.nav.faq}</Link></li>
            <li><Link className="hover:text-white" href={p("/careers")}>{dict.nav.careers}</Link></li>
            <li><Link className="hover:text-white" href={p("/contact")}>{dict.nav.contact}</Link></li>
            <li><Link className="hover:text-white" href={p("/privacy")}>{dict.nav.privacy}</Link></li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-white">{dict.footer.getInTouch}</h2>
          <address className="space-y-3.5 text-sm not-italic">
            <a href={SITE.mapsUrl} target="_blank" rel="noopener" className="flex gap-3 hover:text-white">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>{fullAddress}</span>
            </a>
            <a href={whatsappLink()} target="_blank" rel="noopener" className="flex gap-3 hover:text-white">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>{SITE.phoneDisplay}</span>
            </a>
            <a href={`mailto:${SITE.email}`} className="flex gap-3 hover:text-white">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <span>{SITE.email}</span>
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 pb-20 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:pb-6">
          <p>
            © {SITE.foundingYear}–{year} {SITE.legalName} · {SITE.registrationNo}. {dict.footer.rights}
          </p>
          <p>Menglembu · Perak · Malaysia</p>
        </div>
      </div>
      </div>
    </footer>
  );
}
