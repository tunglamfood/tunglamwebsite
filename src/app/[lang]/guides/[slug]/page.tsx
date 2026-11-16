import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import { LOCALES, fmt, hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog, getGuides, getRecipes } from "@/lib/data";
import { mediaUrl } from "@/lib/media";
import { articleJsonLd, pageMetadata } from "@/lib/seo";
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

export async function generateStaticParams() {
  const guides = await getGuides();
  return LOCALES.flatMap((lang) => guides.map((g) => ({ lang, slug: g.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/guides/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const g = (await getGuides()).find((x) => x.slug === slug);
  if (!g) return { robots: { index: false } };
  const title = t(g.title, lang) ?? g.slug;
  const img = mediaUrl(g.image_path);
  return pageMetadata({
    locale: lang,
    path: `/guides/${g.slug}`,
    title: t(g.meta_title, lang) ?? title,
    description: t(g.meta_description, lang) ?? t(g.lead, lang) ?? "",
    type: "article",
    publishedTime: g.published_at,
    modifiedTime: g.updated_at,
    image: img ? { url: img, width: g.image_width ?? undefined, height: g.image_height ?? undefined, alt: t(g.image_alt, lang) ?? title } : null,
  });
}

const DATE_LOCALE = { en: "en-MY", ms: "ms-MY", zh: "zh-CN" } as const;

export default async function GuidePage({ params }: PageProps<"/[lang]/guides/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const [guides, catalog, allRecipes] = await Promise.all([getGuides(), getCatalog(), getRecipes()]);
  const g = guides.find((x) => x.slug === slug);
  if (!g) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const url = p(`/guides/${g.slug}`);
  const title = t(g.title, lang) ?? g.slug;
  const img = mediaUrl(g.image_path);
  const blocks = parseGuide(t(g.body, lang) ?? "");
  const toc = blocks.flatMap((b) => (b.type === "h2" ? [b] : []));
  const summary = t(g.summary, lang) ?? [];
  const faqs = g.faqs.map((f) => ({ q: t(f.q, lang) ?? "", a: t(f.a, lang) ?? "" })).filter((f) => f.q && f.a);

  const products = g.product_slugs
    .map((s) => catalog.products.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => toCardData(x, lang, x.brand_id ? catalog.brandById.get(x.brand_id) : undefined));
  const recipes = g.recipe_slugs.map((s) => allRecipes.find((r) => r.slug === s)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  const related = g.related_slugs
    .map((s) => guides.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .concat(guides.filter((x) => x.id !== g.id && !g.related_slugs.includes(x.slug)))
    .slice(0, 3);
  const updated = new Date(g.updated_at).toLocaleDateString(DATE_LOCALE[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

  return (
    <article>
      <div className="container-x pt-8">
        <Breadcrumbs
          items={[
            { name: d.common.breadcrumbHome, href: p("/") },
            { name: d.guides.title, href: p("/guides") },
            { name: title, href: url },
          ]}
        />
      </div>

      <header className="container-x grid items-center gap-6 py-6 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="eyebrow mb-4">{d.guides.label}</p>
          <h1 className="font-display text-[1.875rem] font-bold leading-[1.1] tracking-[-0.025em] sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{t(g.lead, lang)}</p>
          <p className="mt-6 text-sm text-muted">
            {fmt(d.guides.byline, { year: SITE.foundingYear })} ·{" "}
            <time dateTime={g.updated_at}>{fmt(d.guides.updated, { date: updated })}</time>
          </p>
        </div>
        {img && (
          <div className="relative order-first aspect-[16/9] overflow-hidden rounded-[1.5rem] border border-line bg-sand shadow-[var(--shadow-card)] sm:rounded-[2rem] lg:order-none">
            <Image src={img} alt={t(g.image_alt, lang) ?? title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
      </header>

      <div className="container-x grid gap-8 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-14">
        {summary.length > 0 && (
          <section aria-labelledby="in-short" className="max-w-3xl rounded-2xl border border-line bg-sand/50 p-5 sm:p-7 lg:col-start-2 lg:row-start-1">
            <h2 id="in-short" className="mb-4 font-display text-xl font-bold tracking-[-0.015em] sm:text-2xl">{d.guides.quickAnswer}</h2>
            <ul className="space-y-3">
              {summary.map((s, i) => (
                <li key={i} className="flex gap-3 leading-relaxed text-ink-soft">
                  <CircleCheck className="mt-1 size-5 shrink-0 text-leaf" aria-hidden />
                  <span><Inline text={s} locale={lang} /></span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
          <h2 className="mb-5 font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:mb-8 sm:text-4xl">{d.guides.products}</h2>
          <ProductGrid products={products} rail />
        </section>
      )}

      {faqs.length > 0 && (
        <section className="container-x max-w-4xl py-12">
          <h2 className="mb-5 font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:mb-8 sm:text-4xl">{d.guides.faqTitle}</h2>
          <FaqList items={faqs} />
        </section>
      )}

      {recipes.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-5 font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:mb-8 sm:text-4xl">{d.guides.recipes}</h2>
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
          <h2 className="mb-5 font-display text-[1.625rem] font-bold leading-[1.15] tracking-[-0.02em] text-ink sm:mb-8 sm:text-4xl">{d.guides.more}</h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((x) => (
              <GuideCard key={x.slug} guide={x} locale={lang} dict={d} />
            ))}
          </div>
        </section>
      )}

      <section className="container-x py-12">
        <div className="rounded-[1.5rem] bg-ink p-6 text-white sm:rounded-[2rem] sm:p-10">
          <h2 className="font-display text-xl font-bold tracking-[-0.015em] sm:text-2xl">{d.guides.ctaTitle}</h2>
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
          headline: title,
          description: t(g.meta_description, lang) ?? t(g.lead, lang) ?? "",
          image: img ?? undefined,
          datePublished: g.published_at,
          dateModified: g.updated_at,
          about: g.about,
        })}
      />
    </article>
  );
}
