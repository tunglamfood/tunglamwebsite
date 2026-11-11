import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog, getRecipes } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { SITE, fullAddress, whatsappLink } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";
import { CertBadges } from "@/components/ui/cert-badges";
import { ProductGrid, toCardData } from "@/components/product/product-card";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { WhatsAppIcon } from "@/components/ui/icons";
import { CountUp } from "@/components/ui/count-up";
import { Floaty, Marquee } from "@/components/ui/lively";
import { brandLogoSrc, seriesImageSrc } from "@/components/brand/brand-logos";

export const revalidate = 3600;

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const H2 = "font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-ink sm:text-4xl";
const LEAD = "mt-2 text-base text-ink-soft sm:mt-3 sm:text-lg";
const CAROUSEL =
  "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden";

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
  const { products, brands, series, categories, brandById, categoryById, seriesOf, productsIn } = catalog;

  const featured = products
    .filter((x) => x.is_featured)
    .slice(0, 8)
    .map((x) => toCardData(x, lang, x.brand_id ? brandById.get(x.brand_id) : undefined, seriesOf(categoryById.get(x.category_id ?? ""))?.slug));

  // Hero headline with one word in the brand colour.
  const hasHighlight = d.home.heroTitle.includes(d.home.heroHighlight);
  const [titleA, titleB = ""] = hasHighlight ? d.home.heroTitle.split(d.home.heroHighlight) : [d.home.heroTitle];
  const ticker = categories.filter((c) => c.parent_id).map((c) => t(c.name, lang) ?? c.slug);

  const stats = [
    { value: SITE.foundingYear, from: 1950, suffix: "", label: d.home.stats.since },
    { value: products.length, from: 0, suffix: "+", label: d.home.stats.products },
    { value: brands.length, from: 0, suffix: "", label: d.home.stats.brands },
    { value: series.length, from: 0, suffix: "", label: d.home.stats.series },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute -right-40 -top-40 -z-10 size-[38rem] rounded-full bg-sun-soft blur-3xl" />
        {/* Mobile: one column ordered eyebrow → headline → food → buttons → text. */}
        <div className="container-x flex flex-col pb-12 pt-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-16">
          <div className="contents lg:block lg:animate-fade-up">
            <p className="eyebrow order-1">{d.home.eyebrow}</p>
            <h1 className="order-2 mt-4 font-display text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:mt-5 xl:text-[4.25rem]">
              {titleA}
              {hasHighlight && <span className="text-brand">{d.home.heroHighlight}</span>}
              {titleB}
            </h1>
            <p className="order-5 mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg lg:mt-6">{d.home.heroText}</p>
            <div className="order-4 mt-6 grid grid-cols-2 gap-3 max-sm:[&>a]:px-2 max-sm:[&>a]:text-[0.9rem] sm:flex sm:flex-wrap lg:mt-8">
              <Link href={p("/products")} className={buttonClass("primary", "lg")}>
                {d.cta.explore} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href={p("/wholesale")} className={buttonClass("ghost", "lg")}>
                {d.cta.wholesale}
              </Link>
            </div>
            <div className="order-6 mt-7 flex items-center gap-3 sm:gap-4 lg:mt-10">
              <CertBadges size={46} className="gap-2" />
              <span className="hidden text-sm font-medium text-muted sm:block">Halal · HACCP · GMP · MeSTI</span>
            </div>
          </div>

          {/* Food collage */}
          <div className="relative order-3 mx-auto mt-4 aspect-square w-full max-w-[19.5rem] sm:max-w-[30rem] lg:order-none lg:mt-0 lg:max-w-none">
            <div aria-hidden className="absolute inset-[8%] rounded-full bg-gradient-to-br from-sun-soft to-sand" />
            <div className="absolute inset-[11%] animate-pop">
              <Image src="/images/cut/hotpot.webp" alt="" fill priority sizes="(min-width: 1024px) 40vw, 80vw" className="object-contain drop-shadow-[0_30px_30px_rgb(31_27_23/0.22)]" />
            </div>
            <Floaty name="tofu-puffs" className="left-0 top-[3%] w-[27%]" size={170} rotate={-12} priority />
            <Floaty name="fish-balls" className="right-0 top-[12%] w-[25%]" size={170} rotate={14} delay={1.2} slow priority />
            <Floaty name="egg-tofu" className="-left-[1%] bottom-[4%] w-[27%]" size={170} rotate={8} delay={0.6} slow />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Ticker */}
      <Marquee items={ticker} className="marquee-mask border-y border-line bg-white py-3.5 text-ink-soft" />

      {/* ------------------------------------------------------------ Stats */}
      <section aria-label="Tung Lam in numbers" className="container-x pt-12 sm:pt-20">
        <dl className="reveal grid grid-cols-2 overflow-hidden rounded-3xl border border-line bg-white lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col-reverse border-line px-4 py-6 text-center odd:border-r sm:py-8 lg:border-r lg:last:border-r-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
            >
              <dt className="mt-1 text-xs text-muted sm:text-sm">{s.label}</dt>
              <dd className="font-display text-4xl font-semibold text-ink sm:text-5xl">
                <CountUp value={s.value} from={s.from} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------------ Series */}
      <section className="container-x py-14 sm:py-24">
        <div className="reveal mb-7 max-w-2xl sm:mb-10">
          <h2 className={H2}>{d.home.seriesTitle}</h2>
          <p className={LEAD}>{d.home.seriesText}</p>
        </div>
        <div className={`${CAROUSEL} md:grid-cols-3`}>
          {series.map((s, i) => (
            <Link
              key={s.slug}
              href={p(`/products/${s.slug}`)}
              className="reveal group flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:w-auto"
              style={delay(i * 100)}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={seriesImageSrc(s)} alt="" fill sizes="(min-width: 768px) 33vw, 80vw" className="object-cover transition duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {productsIn(s).length} {d.home.stats.products.toLowerCase()}
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-semibold text-ink">{t(s.name, lang)}</h3>
                <p className="mt-2 text-sm text-ink-soft sm:text-base">{t(s.tagline, lang)}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-brand">
                  {d.cta.viewAll} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <section className="bg-sand/50 py-14 sm:py-24">
        <div className="container-x">
          <div className="reveal mb-7 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3">{d.nav.products}</p>
              <h2 className={H2}>{d.home.featuredTitle}</h2>
              <p className={LEAD}>{d.home.featuredText}</p>
            </div>
            <Link href={p("/products")} className={buttonClass("ghost", "md", "self-start md:self-auto")}>
              {d.nav.allProducts} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="reveal">
            <ProductGrid products={featured} carousel />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Story */}
      <section className="container-x grid items-center gap-10 py-14 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="reveal relative" data-dir="left">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[var(--shadow-lift)]">
            <Image src="/images/craft.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-5 right-4 rounded-2xl bg-white px-5 py-3 shadow-[var(--shadow-lift)] sm:right-8 sm:px-6 sm:py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">{d.common.since}</p>
            <p className="font-display text-3xl font-semibold leading-none text-brand sm:text-4xl">{SITE.foundingYear}</p>
          </div>
        </div>
        <div className="reveal" data-dir="right">
          <p className="eyebrow mb-3">{d.home.storyEyebrow}</p>
          <h2 className={H2}>{d.home.storyTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{d.home.storyText}</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-line bg-white p-5">
            <p className="text-sm font-semibold text-ink">{d.home.certTitle}</p>
            <CertBadges size={50} className="gap-2.5" />
          </div>
          <Link href={p("/about")} className={buttonClass("secondary", "md", "mt-7")}>
            {d.nav.about} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ Brands */}
      <section className="container-x pb-14 sm:pb-24">
        <div className="reveal mb-7 text-center sm:mb-10">
          <h2 className={H2}>{d.home.brandsTitle}</h2>
          <p className={`mx-auto max-w-xl ${LEAD}`}>{d.home.brandsText}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
          {brands.map((b, i) => {
            const logo = brandLogoSrc(b);
            return (
              <li key={b.slug} className="reveal" style={delay(i * 80)}>
                <Link
                  href={p(`/brands/${b.slug}`)}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4 text-center transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:gap-4 sm:p-6"
                >
                  <div className="relative h-16 w-full sm:h-24">{logo && <Image src={logo} alt={`${b.name} logo`} fill sizes="200px" className="object-contain" />}</div>
                  <p className="text-xs leading-snug text-muted sm:text-sm">{t(b.tagline, lang)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Wholesale CTA */}
      <section className="container-x">
        <div className="reveal grid overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="px-6 py-10 sm:px-12 sm:py-16">
            <p className="eyebrow mb-3 !text-sun">{d.nav.wholesale}</p>
            <h2 className={`${H2} !text-white`}>{d.home.wholesaleTitle}</h2>
            <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">{d.home.wholesaleText}</p>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href={p("/wholesale")} className={buttonClass("primary", "lg")}>
                {d.cta.wholesale} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg")}>
                <WhatsAppIcon /> {d.cta.whatsapp}
              </a>
            </div>
          </div>
          <div className="relative min-h-56 lg:min-h-0">
            <Image src="/images/wholesale.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Recipes */}
      {recipes.length > 0 && (
        <section className="container-x py-14 sm:py-24">
          <div className="reveal mb-7 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3">{d.nav.recipes}</p>
              <h2 className={H2}>{d.home.recipesTitle}</h2>
              <p className={LEAD}>{d.home.recipesText}</p>
            </div>
            <Link href={p("/recipes")} className={buttonClass("ghost", "md", "self-start md:self-auto")}>
              {d.cta.viewAll} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className={`${CAROUSEL} sm:grid-cols-2 lg:grid-cols-3`}>
            {recipes.slice(0, 3).map((r, i) => (
              <div key={r.slug} className="reveal w-[80%] shrink-0 snap-start sm:w-auto" style={delay(i * 100)}>
                <RecipeCard recipe={r} locale={lang} dict={d} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Visit */}
      <section className="container-x">
        <div className="reveal grid overflow-hidden rounded-3xl border border-line bg-white lg:grid-cols-2">
          <div className="p-6 sm:p-12">
            <h2 className={H2}>{d.home.visitTitle}</h2>
            <ul className="mt-6 space-y-4 text-ink-soft sm:mt-8">
              {[
                { icon: MapPin, text: fullAddress, href: SITE.mapsUrl },
                { icon: Phone, text: SITE.phoneDisplay, href: `tel:${SITE.phone}` },
                { icon: Mail, text: SITE.email, href: `mailto:${SITE.email}` },
              ].map((r) => (
                <li key={r.text}>
                  <a href={r.href} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="flex items-center gap-4 hover:text-ink">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                      <r.icon className="size-5" aria-hidden />
                    </span>
                    <span>{r.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={p("/contact")} className={buttonClass("primary", "md")}>
                {d.cta.contactSales}
              </Link>
              <a href={SITE.mapsUrl} target="_blank" rel="noopener" className={buttonClass("ghost", "md")}>
                {d.cta.getDirections}
              </a>
            </div>
          </div>
          <iframe
            title="Tung Lam Food location map"
            src={`https://maps.google.com/maps?q=${SITE.geo.lat},${SITE.geo.lng}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="min-h-80 w-full border-0"
          />
        </div>
      </section>
    </>
  );
}
