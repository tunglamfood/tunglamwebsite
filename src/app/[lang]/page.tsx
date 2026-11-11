import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog, getRecipes } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { SITE, fullAddress, whatsappLink } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { CertBadges } from "@/components/ui/cert-badges";
import { ProductGrid, toCardData } from "@/components/product/product-card";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { WhatsAppIcon } from "@/components/ui/icons";
import { BRAND_LOGOS, SERIES_IMAGES } from "@/components/brand/brand-logos";

export const revalidate = 3600;


export async function generateMetadata({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/", title: d.meta.homeTitle, description: d.meta.homeDescription, absoluteTitle: true });
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const [catalog, recipes] = await Promise.all([getCatalog(), getRecipes()]);
  const { products, brands, series, brandById, categoryById, seriesOf, productsIn } = catalog;

  const featured = products
    .filter((x) => x.is_featured)
    .slice(0, 8)
    .map((x) => toCardData(x, lang, x.brand_id ? brandById.get(x.brand_id) : undefined, seriesOf(categoryById.get(x.category_id ?? ""))?.slug));

  const stats = [
    { value: String(SITE.foundingYear), label: d.home.stats.since },
    { value: `${products.length}+`, label: d.home.stats.products },
    { value: String(brands.length), label: d.home.stats.brands },
    { value: String(series.length), label: d.home.stats.series },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden">
        {/* Desktop: full-bleed background photo. Mobile: the photo sits below the text instead. */}
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 100vw, 1px"
          className="-z-20 hidden object-cover object-[70%_center] md:block"
        />
        <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-cream via-cream/75 to-cream/0 md:block" />
        <div className="absolute inset-x-0 bottom-0 -z-10 hidden h-32 bg-gradient-to-t from-cream to-transparent md:block" />
        <div className="container-x grid items-center pb-8 pt-8 md:min-h-[min(88vh,52rem)] md:py-20 lg:py-28">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-4 sm:mb-5">{d.home.eyebrow}</p>
            <h1 className="font-display text-[2.3rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {d.home.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:mt-6 sm:text-xl">{d.home.heroText}</p>
            <div className="mt-7 grid gap-3 sm:mt-9 sm:flex sm:flex-wrap">
              <Link href={p("/products")} className={buttonClass("primary", "lg")}>
                {d.cta.explore} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href={p("/wholesale")} className={buttonClass("ghost", "lg")}>
                {d.cta.wholesale}
              </Link>
            </div>
            <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-[1.5rem] shadow-[var(--shadow-card)] md:hidden">
              <Image src="/images/hero.webp" alt="" fill priority sizes="(min-width: 768px) 1px, 100vw" className="object-cover object-[65%_center]" />
            </div>
            <div className="mt-6 flex items-center gap-3 sm:mt-10 sm:gap-4">
              <CertBadges size={48} className="gap-2" />
              <span className="hidden text-sm font-medium text-ink-soft sm:block">Halal · HACCP · GMP · MeSTI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Stats */}
      <section aria-label="Tung Lam in numbers" className="container-x relative z-10 md:-mt-6">
        <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-card)] bg-ink text-white sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse border-white/10 px-4 py-5 text-center sm:px-6 sm:py-7 odd:border-r sm:border-r sm:last:border-r-0 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
              <dt className="mt-1 text-xs text-white/60 sm:text-sm">{s.label}</dt>
              <dd className="font-display text-3xl font-semibold text-white sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ Series */}
      <section className="container-x py-14 sm:py-24">
        <SectionHeading title={d.home.seriesTitle} text={d.home.seriesText} />
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {series.map((s) => {
            const count = productsIn(s).length;
            return (
              <Link
                key={s.slug}
                href={p(`/products/${s.slug}`)}
                className="group relative isolate flex aspect-[4/5] w-[80%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[1.5rem] p-5 text-white shadow-[var(--shadow-card)] sm:w-[55%] sm:p-7 md:w-auto md:rounded-[1.75rem]"
              >
                <Image
                  src={SERIES_IMAGES[s.slug] ?? "/images/hero.webp"}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="-z-20 object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
                <span className="mb-2 text-sm font-medium text-white/75">{count} {d.home.stats.products.toLowerCase()}</span>
                <h3 className="font-display text-2xl font-semibold sm:text-3xl">{t(s.name, lang)}</h3>
                <p className="mt-2 max-w-xs text-sm text-white/85 sm:text-base">{t(s.tagline, lang)}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold sm:mt-5">
                  {d.cta.viewAll} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <section className="bg-sand/60 py-14 sm:py-24">
        <div className="container-x">
          <SectionHeading
            title={d.home.featuredTitle}
            text={d.home.featuredText}
            action={
              <Link href={p("/products")} className={buttonClass("ghost", "md")}>
                {d.nav.allProducts} <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <ProductGrid products={featured} />
        </div>
      </section>

      {/* ------------------------------------------------------------ Story */}
      <section className="container-x grid items-center gap-12 py-14 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lift)]">
            <Image src="/images/craft.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-2 rounded-2xl bg-brand px-6 py-5 text-white shadow-[var(--shadow-lift)] sm:-right-6">
            <p className="text-sm text-white/80">{d.common.since}</p>
            <p className="font-display text-4xl font-semibold">{SITE.foundingYear}</p>
          </div>
        </div>
        <div>
          <p className="eyebrow mb-4">{d.home.storyEyebrow}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{d.home.storyTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{d.home.storyText}</p>
          <div className="mt-8 rounded-2xl border border-line bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-ink">{d.home.certTitle}</p>
            <CertBadges size={52} className="gap-2.5 sm:gap-3" />
          </div>
          <Link href={p("/about")} className={buttonClass("secondary", "md", "mt-8")}>
            {d.nav.about} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ Brands */}
      <section className="container-x pb-14 sm:pb-24">
        <SectionHeading title={d.home.brandsTitle} text={d.home.brandsText} align="center" />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {brands.map((b) => {
            const logo = BRAND_LOGOS[b.slug];
            return (
              <li key={b.slug}>
                <Link
                  href={p(`/brands/${b.slug}`)}
                  className="group card flex h-full flex-col items-center gap-3 p-4 text-center transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:gap-4 sm:p-6"
                >
                  <div className="relative h-16 w-full sm:h-24">
                    {logo && <Image src={logo.src} alt={`${b.name} logo`} fill sizes="200px" className="object-contain" />}
                  </div>
                  <p className="text-xs leading-snug text-muted sm:text-sm">{t(b.tagline, lang)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Wholesale CTA */}
      <section className="container-x">
        <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-ink px-5 py-10 text-white sm:rounded-[2rem] sm:px-12 sm:py-16 lg:py-20">
          <Image src="/images/wholesale.webp" alt="" fill sizes="100vw" className="-z-20 object-cover opacity-60" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
          <div className="max-w-xl">
            <p className="eyebrow mb-4 !text-gold">{d.nav.wholesale}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{d.home.wholesaleTitle}</h2>
            <p className="mt-4 text-base text-white/80 sm:text-lg">{d.home.wholesaleText}</p>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href={p("/wholesale")} className={buttonClass("primary", "lg")}>
                {d.cta.wholesale} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg")}>
                <WhatsAppIcon /> {d.cta.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Recipes */}
      {recipes.length > 0 && (
        <section className="container-x py-14 sm:py-24">
          <SectionHeading
            title={d.home.recipesTitle}
            text={d.home.recipesText}
            action={
              <Link href={p("/recipes")} className={buttonClass("ghost", "md")}>
                {d.cta.viewAll} <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.slice(0, 3).map((r) => (
              <RecipeCard key={r.slug} recipe={r} locale={lang} dict={d} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Visit */}
      <section className="container-x">
        <div className="grid overflow-hidden rounded-[1.5rem] border border-line bg-white sm:rounded-[2rem] lg:grid-cols-2">
          <div className="p-6 sm:p-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight">{d.home.visitTitle}</h2>
            <ul className="mt-6 space-y-4 text-ink-soft sm:mt-8 sm:space-y-5">
              <li className="flex gap-4">
                <MapPin className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
                <span>{fullAddress}</span>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
                <a href={`tel:${SITE.phone}`} className="hover:text-brand">{SITE.phoneDisplay}</a>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-1 size-5 shrink-0 text-brand" aria-hidden />
                <a href={`mailto:${SITE.email}`} className="hover:text-brand">{SITE.email}</a>
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={p("/contact")} className={buttonClass("primary", "md")}>{d.cta.contactSales}</Link>
              <a href={SITE.mapsUrl} target="_blank" rel="noopener" className={buttonClass("ghost", "md")}>{d.cta.getDirections}</a>
            </div>
          </div>
          <iframe
            title="Tung Lam Food location map"
            src={`https://maps.google.com/maps?q=${SITE.geo.lat},${SITE.geo.lng}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="min-h-80 w-full border-0 grayscale-[30%]"
          />
        </div>
      </section>
    </>
  );
}
