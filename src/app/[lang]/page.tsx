import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
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
import { Floaty, Marquee, SpinBadge, Wave, type Cutout } from "@/components/ui/lively";
import { brandLogoSrc, seriesImageSrc } from "@/components/brand/brand-logos";

export const revalidate = 3600;

/** Colour theme per series card. */
const SERIES_THEME: Record<string, { panel: string; chip: string; cut: Cutout }> = {
  "tofu-series": { panel: "bg-sun text-ink", chip: "bg-ink text-white", cut: "tofu-puffs" },
  "steamboat-series": { panel: "bg-brand text-white", chip: "bg-white text-brand", cut: "fish-balls" },
  "dessert-series": { panel: "bg-leaf text-white", chip: "bg-white text-leaf", cut: "cendol" },
};
const SERIES_FALLBACK = { panel: "bg-ink text-white", chip: "bg-white text-ink", cut: "hotpot" as Cutout };
const BRAND_ACCENT: Record<string, string> = { "tung-lam": "bg-brand", sakura: "bg-sakura", cili: "bg-sun", ad: "bg-leaf-bright" };

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const H2 = "font-display text-[1.9rem] font-bold leading-tight tracking-tight sm:text-5xl";

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

  // Hero headline with one highlighted word.
  const hasHighlight = d.home.heroTitle.includes(d.home.heroHighlight);
  const [titleA, titleB = ""] = hasHighlight ? d.home.heroTitle.split(d.home.heroHighlight) : [d.home.heroTitle];
  const ticker = categories.filter((c) => c.parent_id).map((c) => t(c.name, lang) ?? c.slug);

  const stats = [
    { value: SITE.foundingYear, from: 1950, suffix: "", label: d.home.stats.since, cls: "bg-brand text-white" },
    { value: products.length, from: 0, suffix: "+", label: d.home.stats.products, cls: "bg-sun text-ink" },
    { value: brands.length, from: 0, suffix: "", label: d.home.stats.brands, cls: "bg-leaf text-white" },
    { value: series.length, from: 0, suffix: "", label: d.home.stats.series, cls: "bg-ink text-white" },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute -left-32 -top-32 -z-10 size-[26rem] rounded-full bg-sun/40 blur-3xl" />
        <div aria-hidden className="absolute -right-24 top-1/3 -z-10 size-[30rem] rounded-full bg-brand/10 blur-3xl" />
        {/* Mobile: one column ordered sticker → headline → food → buttons → text (food + buttons on the first screen). */}
        <div className="container-x flex flex-col pb-12 pt-6 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-6 lg:pb-20 lg:pt-14">
          <div className="contents lg:block lg:animate-fade-up">
            <p className="sticker order-1 -rotate-2 self-start">{d.home.eyebrow}</p>
            <h1 className="order-2 mt-4 font-display text-[2.35rem] lg:mt-5 font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl xl:text-7xl">
              {titleA}
              {hasHighlight && <span className="marker text-brand">{d.home.heroHighlight}</span>}
              {titleB}
            </h1>
            <p className="order-5 mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-xl lg:mt-5">{d.home.heroText}</p>
            <div className="order-4 mt-5 grid grid-cols-2 gap-3 max-sm:[&>a]:px-2 max-sm:[&>a]:text-[0.9rem] sm:flex sm:flex-wrap lg:mt-7">
              <Link href={p("/products")} className={buttonClass("primary", "lg", "border-2 border-ink !shadow-[4px_4px_0_var(--color-ink)]")}>
                {d.cta.explore} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href={p("/wholesale")} className={buttonClass("light", "lg", "border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]")}>
                {d.cta.wholesale}
              </Link>
            </div>
            <div className="order-6 mt-6 flex items-center gap-3 sm:gap-4 lg:mt-8">
              <CertBadges size={48} className="gap-2" />
              <span className="hidden text-sm font-semibold text-ink-soft sm:block">Halal · HACCP · GMP · MeSTI</span>
            </div>
          </div>

          {/* Food collage */}
          <div className="relative order-3 mx-auto mt-3 aspect-square w-full max-w-[19.5rem] sm:max-w-[30rem] lg:order-none lg:mt-0 lg:max-w-none">
            <div aria-hidden className="absolute inset-[7%] rounded-full border-2 border-ink bg-sun" />
            <div aria-hidden className="dots absolute inset-[7%] rounded-full text-ink/10" />
            <div className="absolute inset-[10%] animate-pop">
              <Image src="/images/cut/hotpot.webp" alt="" fill priority sizes="(min-width: 1024px) 40vw, 80vw" className="object-contain drop-shadow-[0_30px_30px_rgb(31_27_23/0.3)]" />
            </div>
            <Floaty name="tofu-puffs" className="-left-[1%] top-[1%] w-[29%]" size={170} rotate={-12} priority />
            <Floaty name="fish-balls" className="-right-[1%] top-[12%] w-[27%]" size={170} rotate={14} delay={1.2} slow priority />
            <Floaty name="egg-tofu" className="-left-[2%] bottom-[2%] w-[29%]" size={170} rotate={8} delay={0.6} slow />
            <Floaty name="chili" className="right-[20%] -top-[3%] w-[19%]" size={110} rotate={30} delay={2} />
            <SpinBadge text="HALAL • HACCP • GMP • MeSTI • SINCE 1999 • " className="absolute -bottom-[1%] right-[2%] size-[30%]" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Ticker */}
      <div className="relative z-10 overflow-hidden py-3">
        <Marquee items={ticker} className="-mx-6 -rotate-1 border-y-2 border-ink bg-brand py-3 text-white sm:py-4" />
      </div>

      {/* ------------------------------------------------------------ Stats */}
      <section aria-label="Tung Lam in numbers" className="container-x pt-12 sm:pt-20">
        <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className={`reveal pop-shadow flex flex-col-reverse rounded-2xl px-4 py-5 text-center sm:py-7 ${s.cls}`} data-dir="zoom" style={delay(i * 90)}>
              <dt className="mt-1 text-xs font-medium opacity-80 sm:text-sm">{s.label}</dt>
              <dd className="font-display text-4xl font-bold sm:text-5xl">
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
          <p className="mt-2 text-base text-ink-soft sm:mt-3 sm:text-lg">{d.home.seriesText}</p>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
          {series.map((s, i) => {
            const theme = SERIES_THEME[s.slug] ?? SERIES_FALLBACK;
            return (
              <Link
                key={s.slug}
                href={p(`/products/${s.slug}`)}
                className="reveal group pop-shadow relative flex w-[82%] shrink-0 snap-start flex-col overflow-hidden rounded-[1.75rem] bg-white sm:w-[55%] md:w-auto"
                style={delay(i * 120)}
              >
                <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-ink">
                  <Image src={seriesImageSrc(s)} alt="" fill sizes="(min-width: 768px) 33vw, 82vw" className="object-cover transition duration-700 group-hover:rotate-1 group-hover:scale-110" />
                  <span className={`absolute left-3 top-3 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${theme.chip}`}>
                    {productsIn(s).length} {d.home.stats.products.toLowerCase()}
                  </span>
                </div>
                <div className={`relative flex flex-1 flex-col p-5 sm:p-6 ${theme.panel}`}>
                  <h3 className="font-display text-2xl font-bold sm:text-3xl">{t(s.name, lang)}</h3>
                  <p className="mt-2 max-w-[70%] text-sm opacity-90 sm:text-base">{t(s.tagline, lang)}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
                    {d.cta.viewAll}
                    <span className="grid size-8 place-items-center rounded-full border-2 border-current transition group-hover:translate-x-1">
                      <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </span>
                  <Floaty name={theme.cut} className="-bottom-2 -right-1 w-24 sm:w-28" size={112} rotate={-10} delay={i} slow />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ Featured */}
      <Wave className="text-sun-soft" />
      <section className="relative overflow-hidden bg-sun-soft pb-10 pt-8 sm:pb-16 sm:pt-12">
        <Floaty name="chili" className="right-[4%] top-2 hidden w-24 lg:block" size={96} rotate={20} />
        <div className="container-x relative">
          <div className="reveal mb-7 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="sticker mb-4 rotate-1 !bg-brand !text-white">{d.nav.products}</p>
              <h2 className={H2}>{d.home.featuredTitle}</h2>
              <p className="mt-2 text-base text-ink-soft sm:mt-3 sm:text-lg">{d.home.featuredText}</p>
            </div>
            <Link href={p("/products")} className={buttonClass("secondary", "md", "self-start md:self-auto")}>
              {d.nav.allProducts} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="reveal">
            <ProductGrid products={featured} carousel />
          </div>
        </div>
      </section>
      <Wave className="text-sun-soft" flip />

      {/* ------------------------------------------------------------ Story */}
      <section className="container-x grid items-center gap-14 py-14 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="reveal relative mx-3 sm:mx-6" data-dir="left">
          <div className="pop-shadow relative aspect-[4/3] -rotate-2 overflow-hidden rounded-[1.75rem]">
            <Image src="/images/craft.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-3 rotate-6 rounded-2xl border-2 border-ink bg-sun px-5 py-3 text-ink shadow-[4px_4px_0_var(--color-ink)] sm:-right-6 sm:px-6 sm:py-4">
            <p className="text-xs font-bold uppercase tracking-wider">{d.common.since}</p>
            <p className="font-display text-4xl font-bold leading-none sm:text-5xl">{SITE.foundingYear}</p>
          </div>
          <Floaty name="egg-tofu" className="-left-6 -top-8 w-24 sm:w-28" size={112} rotate={-14} slow />
        </div>
        <div className="reveal" data-dir="right">
          <p className="sticker mb-4 -rotate-1 !bg-leaf !text-white">{d.home.storyEyebrow}</p>
          <h2 className={H2}>{d.home.storyTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{d.home.storyText}</p>
          <div className="mt-7 rounded-2xl border-2 border-dashed border-ink/25 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-ink">{d.home.certTitle}</p>
            <CertBadges size={54} className="gap-2.5 sm:gap-3" />
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
          <p className="mx-auto mt-2 max-w-xl text-base text-ink-soft sm:mt-3 sm:text-lg">{d.home.brandsText}</p>
        </div>
        <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {brands.map((b, i) => {
            const logo = brandLogoSrc(b);
            return (
              <li key={b.slug} className="reveal" data-dir="zoom" style={delay(i * 90)}>
                <Link href={p(`/brands/${b.slug}`)} className="pop-shadow group flex h-full flex-col items-center overflow-hidden rounded-2xl bg-white text-center">
                  <span className={`h-2.5 w-full border-b-2 border-ink ${BRAND_ACCENT[b.slug] ?? "bg-ink"}`} />
                  <div className="flex flex-1 flex-col items-center gap-3 p-4 sm:gap-4 sm:p-6">
                    <div className="relative h-16 w-full transition duration-300 group-hover:scale-110 sm:h-24">
                      {logo && <Image src={logo} alt={`${b.name} logo`} fill sizes="200px" className="object-contain" />}
                    </div>
                    <p className="text-xs leading-snug text-muted sm:text-sm">{t(b.tagline, lang)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------------ Wholesale CTA */}
      <section className="container-x">
        <div className="reveal pop-shadow relative isolate grid overflow-hidden rounded-[1.75rem] bg-brand text-white sm:rounded-[2.25rem] lg:grid-cols-[1.1fr_0.9fr]" data-dir="zoom">
          <div aria-hidden className="dots absolute inset-0 -z-10 text-white/15" />
          <div className="relative px-5 py-10 sm:px-12 sm:py-16">
            <p className="sticker mb-5 -rotate-2">{d.nav.wholesale}</p>
            <h2 className={H2}>{d.home.wholesaleTitle}</h2>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">{d.home.wholesaleText}</p>
            <div className="mt-7 grid gap-3 sm:mt-8 sm:flex sm:flex-wrap">
              <Link href={p("/wholesale")} className={buttonClass("light", "lg", "border-2 border-ink shadow-[4px_4px_0_var(--color-ink)]")}>
                {d.cta.wholesale} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg", "border-2 border-ink !shadow-[4px_4px_0_var(--color-ink)]")}>
                <WhatsAppIcon /> {d.cta.whatsapp}
              </a>
            </div>
          </div>
          <div className="relative min-h-56 border-t-2 border-ink lg:min-h-0 lg:border-l-2 lg:border-t-0">
            <Image src="/images/wholesale.webp" alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Recipes */}
      {recipes.length > 0 && (
        <section className="container-x py-14 sm:py-24">
          <div className="reveal mb-7 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="sticker mb-4 rotate-1">{d.nav.recipes}</p>
              <h2 className={H2}>{d.home.recipesTitle}</h2>
              <p className="mt-2 text-base text-ink-soft sm:mt-3 sm:text-lg">{d.home.recipesText}</p>
            </div>
            <Link href={p("/recipes")} className={buttonClass("secondary", "md", "self-start md:self-auto")}>
              {d.cta.viewAll} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden sm:grid-cols-2 lg:grid-cols-3">
            {recipes.slice(0, 3).map((r, i) => (
              <div key={r.slug} className="reveal w-[80%] shrink-0 snap-start sm:w-auto" style={delay(i * 110)}>
                <RecipeCard recipe={r} locale={lang} dict={d} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ Visit */}
      <section className="container-x">
        <div className="reveal pop-shadow grid overflow-hidden rounded-[1.75rem] bg-white sm:rounded-[2.25rem] lg:grid-cols-2">
          <div className="p-6 sm:p-12">
            <h2 className="font-display text-[1.9rem] font-bold leading-tight tracking-tight sm:text-4xl">{d.home.visitTitle}</h2>
            <ul className="mt-6 space-y-4 text-ink-soft sm:mt-8">
              {[
                { icon: MapPin, text: fullAddress, href: SITE.mapsUrl, bg: "bg-brand text-white" },
                { icon: Phone, text: SITE.phoneDisplay, href: `tel:${SITE.phone}`, bg: "bg-sun text-ink" },
                { icon: Mail, text: SITE.email, href: `mailto:${SITE.email}`, bg: "bg-leaf text-white" },
              ].map((r) => (
                <li key={r.text}>
                  <a href={r.href} {...(r.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="flex items-center gap-4 hover:text-ink">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl border-2 border-ink ${r.bg}`}>
                      <r.icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-medium">{r.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={p("/contact")} className={buttonClass("primary", "md")}>
                {d.cta.contactSales} <ArrowUpRight className="size-4" aria-hidden />
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
            className="min-h-80 w-full border-0 border-t-2 border-ink lg:border-l-2 lg:border-t-0"
          />
        </div>
      </section>
    </>
  );
}
