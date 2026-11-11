import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { SITE, fullAddress, whatsappLink } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/contact", title: d.contact.metaTitle, description: d.contact.metaDescription });
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const rows = [
    { icon: MapPin, label: d.contact.address, value: fullAddress, href: SITE.mapsUrl },
    { icon: Phone, label: d.contact.phone, value: SITE.phoneDisplay, href: `tel:${SITE.phone}` },
    { icon: Mail, label: d.contact.email, value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Clock, label: d.contact.hours, value: d.contact.hoursText },
  ];

  return (
    <>
      <PageHeader
        cut="cincau"
        cut2="chili"
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.nav.contact, href: p("/contact") },
        ]}
        title={d.contact.title}
        lead={d.contact.lead}
      />
      <section className="container-x grid gap-10 py-10 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <ul className="space-y-3">
            {rows.map((r) => {
              const inner = (
                <>
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sun text-ink">
                    <r.icon className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{r.label}</span>
                    <span className="mt-0.5 block font-medium text-ink">{r.value}</span>
                  </span>
                </>
              );
              return (
                <li key={r.label}>
                  {r.href ? (
                    <a href={r.href} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="pop-shadow flex gap-4 rounded-2xl bg-white p-5">
                      {inner}
                    </a>
                  ) : (
                    <div className="flex gap-4 rounded-2xl border-2 border-ink bg-white p-5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg", "w-full")}>
            <WhatsAppIcon /> {d.cta.whatsapp} · {SITE.phoneDisplay}
          </a>
        </div>
        <div className="reveal rounded-[1.5rem] border-2 border-ink bg-white p-5 shadow-[6px_6px_0_var(--color-ink)] sm:rounded-[2rem] sm:p-10" data-dir="right">
          <InquiryForm labels={d.form} locale={lang} kinds={["general", "wholesale", "product"]} whatsappHref={whatsappLink()} />
        </div>
      </section>
      <section className="container-x">
        <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.contact.mapTitle}</h2>
        <iframe
          title="Tung Lam Food location map"
          src={`https://maps.google.com/maps?q=${SITE.geo.lat},${SITE.geo.lng}&z=15&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-72 w-full rounded-[1.5rem] border-0 sm:h-[26rem] sm:rounded-[2rem] shadow-[var(--shadow-card)]"
        />
      </section>
    </>
  );
}
