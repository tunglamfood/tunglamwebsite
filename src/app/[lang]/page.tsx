import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, CalendarDays, Layers, Mail, MapPin, Package, Phone } from "lucide-react";
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
import { Marquee } from "@/components/ui/lively";
import { Rail } from "@/components/ui/rail";
import { H2_CLASS } from "@/components/ui/section-heading";
import { brandLogoSrc, seriesImageSrc } from "@/components/brand/brand-logos";
import ShinyText from "@/components/reactbits/ShinyText";
import Magnet from "@/components/reactbits/Magnet";
import SpotlightCard from "@/components/reactbits/SpotlightCard";

export const revalidate = 3600;

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const H2 = H2_CLASS;
const LEAD = "mt-2 text-[0.975rem] text-ink-soft sm:mt-3 sm:text-lg";

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
    { value: SITE.foundingYear, from: 1950, suffix: "", label: d.home.stats.since, icon: CalendarDays },
    { value: products.length, from: 0, suffix: "+", label: d.home.stats.products, icon: Package },
    { value: brands.length, from: 0, suffix: "", label: d.home.stats.brands, icon: BadgeCheck },
    { value: series.length, from: 0, suffix: "", label: d.home.stats.series, icon: Layers },
  ];

  const sinceBadge = (big?: boolean) => (
    <div className="flex items-center gap-3">
      <span className={`grid place-items-center rounded-xl bg-brand text-white ${big ? "size-11" : "size-9"}`}>
        <CalendarDays className={big ? "size-5" : "size-[1.125rem]"} aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[0.68rem] font-medium uppercase tracking-wider text-muted">{d.common.since}</span>
        <span className={`block font-display font-bold text-ink ${big ? "text-2xl" : "text-lg"}`}>{SITE.foundingYear}</span>
      </span>
    </div>
  );

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      {/* Phones: photo first, then the pitch. Desktop: pitch left, photo right with floating info cards. */}
      <section className="relative isolate overflow-hidden bg-white">
        <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
        <div aria-hidden className="absolute -right-40 -top-48 -z-10 size-[40rem] rounded-full bg-brand/[0.05] blur-3xl" />
        <div className="container-x grid items-center gap-7 pb-12 pt-4 sm:pt-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:pb-24 lg:pt-16">
          <div className="relative lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand shadow-[var(--shadow-lift)] sm:aspect-[16/10] lg:aspect-[4/5] lg:rounded-[2rem]">
              <Image src="/images/hero.webp" alt="" fill priority sizes="(min-width: 1024px) 46vw, 100vw" className="animate-pop object-cover object-[68%_center]" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent lg:hidden" />
              {/* Phones: compact badge inside the photo */}
              <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 py-2 pl-2 pr-3.5 shadow-[var(--shadow-pop)] backdrop-blur lg:hidden">{sinceBadge()}</div>
            </div>
            {/* Desktop: floating cards */}
            <div className="absolute -left-10 bottom-12 hidden animate-float-slow rounded-2xl bg-white p-4 shadow-[var(--shadow-pop)] lg:block">
              {sinceBadge(true)}
              <p className="mt-2.5 border-t border-line pt-2.5 text-xs font-medium text-muted">Menglembu · Perak · Malaysia</p>
            </div>
            <div className="absolute -right-5 top-10 hidden animate-float rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-pop)] lg:block" style={{ animationDelay: "1.2s" }}>
              <p className="mb-2 text-xs font-semibold text-ink">{d.products.halal}</p>
              <CertBadges size={34} className="gap-1.5" />
            </div>
          </div>

          <div className="lg:order-1 lg:animate-fade-up">
            <p className="eyebrow">
              <ShinyText text={d.home.eyebrow} color="#45413d" shineColor="#d71920" speed={3} delay={2.5} />
            </p>
            <h1 className="mt-4 font-display text-[2.15rem] font-bold leading-[1.06] tracking-[-0.035em] text-ink sm:text-6xl lg:mt-6 xl:text-[4.1rem]">
              {titleA}
              {hasHighlight && <ShinyText text={d.home.heroHighlight} color="#d71920" shineColor="#ff9a94" speed={2.8} delay={3} />}
              {titleB}
            </h1>
            <p className="mt-4 max-w-xl text-[0.975rem] leading-relaxed text-ink-soft sm:text-lg lg:mt-6">{d.home.heroText}</p>
            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 lg:mt-9">
              <Magnet padding={60} magnetStrength={5} maxOffset={10} innerClassName="w-full">
                <Link href={p("/products")} className={buttonClass("primary", "lg", "w-full")}>
                  {d.cta.explore} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Magnet>
              <Magnet padding={60} magnetStrength={5} maxOffset={10} innerClassName="w-full">
                <Link href={p("/wholesale")} className={buttonClass("secondary", "lg", "w-full")}>
                  {d.cta.wholesale}
                </Link>
              </Magnet>
            </div>
            <div className="mt-7 flex items-center gap-3 border-t border-line pt-6 sm:gap-4 lg:mt-10">
              <CertBadges size={40} className="gap-1.5" />
              <span className="text-xs font-medium text-muted sm:text-sm">Halal · HACCP · GMP · MeSTI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Ticker */}
      <Marquee items={ticker} className="marquee-mask border-y border-line bg-white py-3 text-muted" />

      {/* ------------------------------------------------------------ Stats */}
      <section aria-label="Tung Lam in numbers" className="container-x pt-10 sm:pt-16">
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <li key={s.label} className="reveal" style={delay(i * 70)}>
              <SpotlightCard
                theme="light"
                spotlightColor="#d71920"
                intensity={0.35}
                spotlightSize={260}
                className="!rounded-2xl !p-3 sm:!p-6"
              >
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 sm:flex sm:flex-col sm:items-start">
                  <span className="row-span-2 grid size-9 place-items-center rounded-xl bg-sand text-ink-soft sm:size-10">
                    <s.icon className="size-[1.125rem]" aria-hidden />
                  </span>
                  <span className="order-last text-xs leading-tight text-muted sm:mt-2 sm:text-sm">{s.label}</span>
                  <strong className="font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:mt-6 sm:text-[2.6rem] sm:leading-none">
                    <CountUp value={s.value} from={s.from} suffix={s.suffix} />
                  </strong>
                </div>
              </SpotlightCard>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Series */}
      {/* Phones: compact rows. Desktop: three tall cards. */}
      <section className="container-x py-14 sm:py-24">
        <div className="reveal mb-6 max-w-2xl sm:mb-10">
          <h2 className={H2}>{d.home.seriesTitle}</h2>
          <p className={LEAD}>{d.home.seriesText}</p>
        </div>
        <div className="grid gap-2.5 md:grid-cols-3 md:gap-5">
          {series.map((s, i) => (
            <Link
              key={s.slug}
              href={p(`/products/${s.slug}`)}
              className="reveal group flex gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-xs)] transition duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] md:flex-col md:rounded-3xl md:p-2"
              style={delay(i * 100)}
            >
              <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl md:aspect-[4/3] md:w-auto md:rounded-2xl">
                <Image src={seriesImageSrc(s)} alt="" fill sizes="(min-width: 768px) 33vw, 120px" className="object-cover transition duration-700 ease-out group-hover:scale-105" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2 md:justify-start md:px-4 md:pb-4 md:pt-5">
                <p className="text-xs font-semibold text-muted">
                  {productsIn(s).length} {d.home.stats.products.toLowerCase()}
                </p>
                <h3 className="mt-0.5 font-display text-lg font-bold tracking-[-0.01em] text-ink md:mt-1 md:text-2xl">{t(s.name, lang)}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft md:mt-2 md:line-clamp-none md:text-[0.975rem]">{t(s.tagline, lang)}</p>
                <span className="mt-auto hidden items-center justify-between pt-5 text-sm font-semibold text-ink md:flex">
                  {d.cta.viewAll}
                  <span className="grid size-9 place-items-center rounded-full border border-line transition duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white">
                    <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <section className="border-y border-line bg-white py-14 sm:py-24">
        <div className="container-x">
          <div className="reveal mb-6 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3 sm:mb-4">{d.nav.products}</p>
              <h2 className={H2}>{d.home.featuredTitle}</h2>
              <p className={LEAD}>{d.home.featuredText}</p>
            </div>
            <div className="hidden md:block">
              <Link href={p("/products")} className={buttonClass("secondary", "md")}>
                {d.nav.allProducts} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="reveal">
            <ProductGrid products={featured} rail />
          </div>
          <Link href={p("/products")} className={buttonClass("secondary", "md", "mt-5 w-full md:!hidden")}>
            {d.nav.allProducts} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ Story */}
      <section className="container-x grid items-center gap-10 py-14 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="reveal relative" data-dir="left">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-[var(--shadow-lift)] lg:rounded-[2rem]">
            <Image src="/images/craft.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-5 right-4 rounded-2xl bg-white py-3 pl-3 pr-5 shadow-[var(--shadow-pop)] sm:right-8">{sinceBadge(true)}</div>
        </div>
        <div className="reveal" data-dir="right">
          <p className="eyebrow mb-3 sm:mb-4">{d.home.storyEyebrow}</p>
          <h2 className={H2}>{d.home.storyTitle}</h2>
          <p className="mt-4 text-[0.975rem] leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{d.home.storyText}</p>
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <p className="text-sm font-semibold text-ink">{d.home.certTitle}</p>
            <CertBadges size={44} className="gap-2" />
          </div>
          <Link href={p("/about")} className={buttonClass("primary", "md", "mt-7 w-full sm:w-auto")}>
            {d.nav.about} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ Brands */}
      <section className="container-x pb-14 sm:pb-24">
        <div className="reveal mb-6 text-center sm:mb-10">
          <h2 className={H2}>{d.home.brandsTitle}</h2>
          <p className={`mx-auto max-w-xl ${LEAD}`}>{d.home.brandsText}</p>
        </div>
        <ul className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-4">
          {brands.map((b, i) => {
            const logo = brandLogoSrc(b);
            return (
              <li key={b.slug} className="reveal" style={delay(i * 80)}>
                <Link
                  href={p(`/brands/${b.slug}`)}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4 text-center shadow-[var(--shadow-xs)] transition duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:gap-4 sm:p-6"
                >
                  <div className="relative h-16 w-full transition duration-500 group-hover:scale-105 sm:h-24">
                    {logo && <Image src={logo} alt={`${b.name} logo`} fill sizes="200px" className="object-contain" />}
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
        <SpotlightCard
          theme="dark"
          intensity={0.12}
          spotlightSize={420}
          className="reveal grid !rounded-3xl !p-0 text-white lg:grid-cols-[1.1fr_0.9fr] lg:!rounded-[2rem]"
          style={{ "--spotlight-card-surface": "#141414" } as CSSProperties}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_left,rgb(215_25_32/0.32),transparent_55%)]" />
          <div className="relative aspect-[16/9] lg:order-last lg:aspect-auto">
            <Image src="/images/wholesale.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="px-5 py-8 sm:px-12 sm:py-16">
            <p className="eyebrow eyebrow-dark mb-4">{d.nav.wholesale}</p>
            <h2 className={`${H2} !text-white`}>{d.home.wholesaleTitle}</h2>
            <p className="mt-4 max-w-xl text-[0.975rem] text-white/70 sm:text-lg">{d.home.wholesaleText}</p>
            <div className="mt-7 grid gap-2.5 sm:mt-9 sm:flex sm:flex-wrap sm:gap-3">
              <Link href={p("/wholesale")} className={buttonClass("light", "lg")}>
                {d.cta.wholesale} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg")}>
                <WhatsAppIcon /> {d.cta.whatsapp}
              </a>
            </div>
          </div>
        </SpotlightCard>
      </section>

      {/* ------------------------------------------------------------ Recipes */}
      {recipes.length > 0 && (
        <section className="container-x py-14 sm:py-24">
          <div className="reveal mb-6 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-3 sm:mb-4">{d.nav.recipes}</p>
              <h2 className={H2}>{d.home.recipesTitle}</h2>
              <p className={LEAD}>{d.home.recipesText}</p>
            </div>
            <div className="hidden md:block">
              <Link href={p("/recipes")} className={buttonClass("secondary", "md")}>
                {d.cta.viewAll} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <Rail className="reveal">
            {recipes.slice(0, 3).map((r) => (
              <RecipeCard key={r.slug} recipe={r} locale={lang} dict={d} stack />
            ))}
          </Rail>
          <Link href={p("/recipes")} className={buttonClass("secondary", "md", "mt-5 w-full md:!hidden")}>
            {d.cta.viewAll} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}

      {/* ------------------------------------------------------------ Visit */}
      <section className="container-x">
        <div className="reveal grid overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow-xs)] lg:grid-cols-2 lg:rounded-[2rem]">
          <div className="p-5 sm:p-12">
            <h2 className={H2}>{d.home.visitTitle}</h2>
            <ul className="mt-6 space-y-2.5 sm:mt-8 sm:space-y-3">
              {[
                { icon: MapPin, text: fullAddress, href: SITE.mapsUrl },
                { icon: Phone, text: SITE.phoneDisplay, href: `tel:${SITE.phone}` },
                { icon: Mail, text: SITE.email, href: `mailto:${SITE.email}` },
              ].map((r) => (
                <li key={r.text}>
                  <a
                    href={r.href}
                    {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                    className="group flex items-center gap-4 rounded-xl border border-line p-3 text-sm text-ink-soft transition-colors hover:border-ink/15 hover:bg-sand/50 hover:text-ink sm:text-base"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand">
                      <r.icon className="size-[1.125rem]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 break-words">{r.text}</span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted transition group-hover:text-ink" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-2.5 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
              <Link href={p("/contact")} className={buttonClass("primary", "md")}>
                {d.cta.contactSales}
              </Link>
              <a href={SITE.mapsUrl} target="_blank" rel="noopener" className={buttonClass("secondary", "md")}>
                {d.cta.getDirections}
              </a>
            </div>
          </div>
          <iframe
            title="Tung Lam Food location map"
            src={`https://maps.google.com/maps?q=${SITE.geo.lat},${SITE.geo.lng}&z=15&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="min-h-64 w-full border-0 sm:min-h-80"
          />
        </div>
      </section>
    </>
  );
}
