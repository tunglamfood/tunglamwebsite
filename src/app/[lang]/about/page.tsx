import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, HandCoins, MapPinned, Sparkles } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { CertBadges } from "@/components/ui/cert-badges";
import { buttonClass } from "@/components/ui/button";

export const revalidate = 3600;
const VALUE_ICONS = [Sparkles, BadgeCheck, HandCoins, MapPinned];

export async function generateMetadata({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/about", title: d.about.metaTitle, description: d.about.metaDescription });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const { brands } = await getCatalog();

  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.nav.about, href: p("/about") },
        ]}
        title={d.about.title}
        lead={d.about.lead}
      />

      <section className="container-x grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-20">
        <div className="prose-tl text-lg">
          {d.about.body.map((x, i) => (
            <p key={i}>{x}</p>
          ))}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
          <Image src="/images/craft.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>

      <section className="bg-sand/60 py-20">
        <div className="container-x">
          <h2 className="mb-10 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{d.about.valuesTitle}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {d.about.values.map((v, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <li key={v.title} className="card p-6">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{v.title}</h3>
                  <p className="mt-2 text-ink-soft">{v.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="container-x grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.about.factsTitle}</h2>
          <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {[
              [d.about.facts.founded, String(SITE.foundingYear)],
              [d.about.facts.hq, "Menglembu, Perak, Malaysia"],
              [d.about.facts.reg, SITE.registrationNo],
              [d.about.facts.brands, brands.map((b) => b.name).join(" · ")],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[10rem_1fr] gap-4 px-5 py-4">
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.home.certTitle}</h2>
          <div className="rounded-2xl border border-line bg-white p-6">
            <CertBadges size={84} className="gap-4" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={p("/products")} className={buttonClass("primary", "md")}>
              {d.cta.explore} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href={p("/contact")} className={buttonClass("ghost", "md")}>{d.nav.contact}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
