import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import { LOCALES, fmt, hasLocale, localePath } from "@/lib/i18n";
import { getCatalog, getRecipes } from "@/lib/data";
import { GUIDES, getGuide } from "@/lib/guides";
import { absoluteUrl, articleJsonLd, pageMetadata } from "@/lib/seo";
import { SITE, whatsappLink } from "@/lib/site";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FaqList } from "@/components/ui/faq-list";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGrid, toCardData } from "@/components/product/product-card";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { GuideBody, Inline, parseGuide } from "@/components/guide/guide-body";
import { GuideCard } from "@/components/guide/guide-card";

export const revalidate = 3600;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => GUIDES.map((g) => ({ lang, slug: g.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/guides/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const g = getGuide(slug);
  if (!g) return { robots: { index: false } };
  const tx = g.text[lang];
  return pageMetadata({
    locale: lang,
    path: `/guides/${g.slug}`,
    title: tx.metaTitle,
    description: tx.metaDescription,
    type: "article",
    publishedTime: g.published,
    modifiedTime: g.updated,
    image: { url: absoluteUrl(g.image.src), width: g.image.width, height: g.image.height, alt: tx.imageAlt },
  });
}

const DATE_LOCALE = { en: "en-MY", ms: "ms-MY", zh: "zh-CN" } as const;

export default async function GuidePage({ params }: PageProps<"/[lang]/guides/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const g = getGuide(slug);
  if (!g) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const tx = g.text[lang];
  const url = p(`/guides/${g.slug}`);
  const blocks = parseGuide(tx.body);
  const toc = blocks.flatMap((b) => (b.type === "h2" ? [b] : []));

  const [catalog, allRecipes] = await Promise.all([getCatalog(), getRecipes()]);
  const products = g.products
    .map((s) => catalog.products.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => toCardData(x, lang, x.brand_id ? catalog.brandById.get(x.brand_id) : undefined));
  const recipes = g.recipes.map((s) => allRecipes.find((r) => r.slug === s)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  const related = g.related.map(getGuide).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const updated = new Date(`${g.updated}T00:00:00Z`).toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <article>
      <div className="container-x pt-8">
        <Breadcrumbs
          items={[
            { name: d.common.breadcrumbHome, href: p("/") },
            { name: d.guides.title, href: p("/guides") },
            { name: tx.title, href: url },
          ]}
        />
      </div>

      <header className="container-x grid items-center gap-6 py-6 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="eyebrow mb-4">{d.guides.label}</p>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight sm:text-5xl">{tx.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{tx.lead}</p>
          <p className="mt-6 text-sm text-muted">
            {fmt(d.guides.byline, { year: SITE.foundingYear })} ·{" "}
            <time dateTime={g.updated}>{fmt(d.guides.updated, { date: updated })}</time>
          </p>
        </div>
        <div className="relative order-first aspect-[16/9] overflow-hidden rounded-[1.5rem] border border-line bg-sand shadow-[var(--shadow-card)] sm:rounded-[2rem] lg:order-none">
          <Image src={g.image.src} alt={tx.imageAlt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </header>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-14">
        <section aria-labelledby="in-short" className="max-w-3xl rounded-2xl border border-line bg-sand/50 p-5 sm:p-7 lg:col-start-2 lg:row-start-1">
          <h2 id="in-short" className="mb-4 font-display text-2xl font-semibold">{d.guides.quickAnswer}</h2>
          <ul className="space-y-3">
            {tx.summary.map((s, i) => (
              <li key={i} className="flex gap-3 leading-relaxed text-ink-soft">
                <CircleCheck className="mt-1 size-5 shrink-0 text-leaf" aria-hidden />
                <span><Inline text={s} locale={lang} /></span>
              </li>
            ))}
          </ul>
        </section>

        {toc.length > 1 && (
          <nav aria-label={d.guides.contents} className="lg:sticky lg:top-24 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{d.guides.contents}</p>
            <ol className="space-y-1 border-l-2 border-line text-[0.95rem]">
              {toc.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`} className="-ml-0.5 block border-l-2 border-transparent py-1.5 pl-4 text-ink-soft transition hover:border-brand hover:text-brand">
                    {h.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="min-w-0 max-w-3xl lg:col-start-2 lg:row-start-2">
          <GuideBody blocks={blocks} locale={lang} />
        </div>
      </div>

      {products.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.guides.products}</h2>
          <ProductGrid products={products} mobileLimit={4} />
        </section>
      )}

      {tx.faqs.length > 0 && (
        <section className="container-x max-w-4xl py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.guides.faqTitle}</h2>
          <FaqList items={tx.faqs} />
        </section>
      )}

      {recipes.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.guides.recipes}</h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {recipes.map((r) => (
              <div key={r.slug}>
                <RecipeCard recipe={r} locale={lang} dict={d} />
              </div>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.guides.more}</h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((x) => (
              <GuideCard key={x.slug} guide={x} locale={lang} dict={d} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-12">
        <div className="rounded-[1.5rem] bg-ink p-6 text-white sm:rounded-[2rem] sm:p-10">
          <h2 className="font-display text-2xl font-semibold">{d.guides.ctaTitle}</h2>
          <p className="mt-2 max-w-2xl text-white/75">{d.guides.ctaText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "md")}>
              <WhatsAppIcon /> {d.cta.whatsapp}
            </a>
            <Link href={p("/wholesale")} className={buttonClass("light", "md")}>{d.cta.wholesale}</Link>
          </div>
        </div>
      </section>

      <JsonLd
        data={articleJsonLd({
          url,
          locale: lang,
          headline: tx.title,
          description: tx.metaDescription,
          image: absoluteUrl(g.image.src),
          datePublished: g.published,
          dateModified: g.updated,
          about: g.about,
        })}
      />
    </article>
  );
}
