import Image from "next/image";
import Link from "next/link";
import { Check, ShieldCheck, Snowflake, Utensils } from "lucide-react";
import type { Catalog, Product } from "@/lib/data";
import { getGuides, getRecipes } from "@/lib/data";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { fmt, localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { ORG_ID, absoluteUrl } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { ProductGrid, toCardData } from "./product-card";
import { GuideLinks } from "@/components/guide/guide-card";
import { Rail } from "@/components/ui/rail";
import { H2_CLASS } from "@/components/ui/section-heading";
import { guidesFor } from "@/lib/guides";

export async function ProductView({ product, catalog, locale, dict: d }: { product: Product; catalog: Catalog; locale: Locale; dict: Dictionary }) {
  const p = (path: string) => localePath(locale, path);
  const { brandById, categoryById, seriesOf, products } = catalog;
  const brand = product.brand_id ? brandById.get(product.brand_id) : undefined;
  const category = product.category_id ? categoryById.get(product.category_id) : undefined;
  const series = seriesOf(category);
  const name = t(product.name, locale) ?? product.slug;
  const img = product.images[0];
  const imgUrl = mediaUrl(img?.path);
  const description = (t(product.description, locale) ?? "").split(/\n\n+/).filter(Boolean);
  const highlights = t(product.highlights, locale) ?? [];
  const ideas = t(product.serving_ideas, locale) ?? [];
  const url = p(`/products/${product.slug}`);
  const waText = fmt(d.products.whatsappMessage, { product: name, url: absoluteUrl(url) });

  const related = products
    .filter((x) => x.id !== product.id && x.category_id === product.category_id)
    .concat(products.filter((x) => x.id !== product.id && x.category_id !== product.category_id && seriesOf(categoryById.get(x.category_id ?? ""))?.id === series?.id))
    .slice(0, 4)
    .map((x) => toCardData(x, locale, x.brand_id ? brandById.get(x.brand_id) : undefined, series?.slug));

  const recipes = (await getRecipes()).filter((r) => r.product_slugs.includes(product.slug)).slice(0, 3);

  const crumbs = [
    { name: d.common.breadcrumbHome, href: p("/") },
    { name: d.products.title, href: p("/products") },
    ...(series ? [{ name: t(series.name, locale) ?? series.slug, href: p(`/products/${series.slug}`) }] : []),
    ...(category && category.id !== series?.id ? [{ name: t(category.name, locale) ?? category.slug, href: p(`/products/${category.slug}`) }] : []),
    { name, href: url },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(url)}#product`,
    name,
    description: t(product.short, locale) ?? description[0],
    url: absoluteUrl(url),
    sku: product.slug,
    image: imgUrl ? [imgUrl] : undefined,
    brand: brand ? { "@type": "Brand", name: brand.name } : undefined,
    category: [t(series?.name, locale), t(category?.name, locale)].filter(Boolean).join(" > "),
    manufacturer: { "@id": ORG_ID },
    countryOfOrigin: { "@type": "Country", name: "Malaysia" },
    ...(product.net_weight ? { additionalProperty: [{ "@type": "PropertyValue", name: "Net weight", value: product.net_weight }] } : {}),
  };

  return (
    <>
      <div className="container-x pt-4 sm:pt-8">
        <Breadcrumbs items={crumbs} />
      </div>

      <section className="container-x grid gap-7 py-6 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-3xl border border-line bg-[#f4f3f1] sm:aspect-[4/5] lg:max-w-none lg:rounded-[2rem]">
            {imgUrl && (
              <Image
                src={imgUrl}
                alt={name}
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="animate-pop object-contain p-6 mix-blend-multiply sm:p-14"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <ul className="mx-auto mt-3 grid max-w-md grid-cols-4 gap-2 lg:max-w-none">
              {product.images.slice(1, 9).map((im) => (
                <li key={im.path} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-[#f4f3f1]">
                  <Image src={mediaUrl(im.path)!} alt={name} fill sizes="120px" className="object-contain p-2 mix-blend-multiply" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {brand && (
            <Link href={p(`/brands/${brand.slug}`)} className="eyebrow mb-4 transition-colors hover:border-ink/20 hover:text-ink">
              {brand.name}
            </Link>
          )}
          <h1 className="font-display text-[1.75rem] font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl">{name}</h1>
          <p className="mt-3 text-base leading-relaxed text-ink-soft sm:mt-4 sm:text-lg">{t(product.short, locale)}</p>

          <dl className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {product.net_weight && (
              <div className="rounded-xl border border-line bg-white p-3.5 shadow-[var(--shadow-xs)] sm:p-4">
                <dt className="text-xs font-medium text-muted">{d.products.netWeight}</dt>
                <dd className="mt-1 font-semibold text-ink">{product.net_weight}</dd>
              </div>
            )}
            {brand && (
              <div className="rounded-xl border border-line bg-white p-3.5 shadow-[var(--shadow-xs)] sm:p-4">
                <dt className="text-xs font-medium text-muted">{d.products.brand}</dt>
                <dd className="mt-1 font-semibold text-ink">{brand.name}</dd>
              </div>
            )}
            {category && (
              <div className="col-span-2 rounded-xl border border-line bg-white p-3.5 shadow-[var(--shadow-xs)] sm:col-span-1 sm:p-4">
                <dt className="text-xs font-medium text-muted">{d.products.category}</dt>
                <dd className="mt-1 font-semibold text-ink">
                  <Link href={p(`/products/${category.slug}`)} className="underline decoration-line underline-offset-4 transition-colors hover:decoration-ink">{t(category.name, locale)}</Link>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 hidden flex-wrap gap-3 lg:flex">
            <a href={whatsappLink(waText)} target="_blank" rel="noopener" className={buttonClass("whatsapp", "lg", "px-5")}>
              <WhatsAppIcon /> {d.cta.whatsapp}
            </a>
            <a href="#enquire" className={buttonClass("secondary", "lg", "px-5")}>{d.cta.enquire}</a>
          </div>

          <ul className="mt-5 flex flex-wrap gap-2 text-[0.8125rem] font-medium text-ink-soft sm:mt-6">
            <li className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5"><ShieldCheck className="size-4 text-leaf" aria-hidden />{d.products.halal}</li>
            <li className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5"><Snowflake className="size-4 text-sky-600" aria-hidden />{d.products.storageText}</li>
          </ul>

          {description.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 font-display text-xl font-bold tracking-[-0.01em] sm:text-2xl">{d.products.about}</h2>
              <div className="prose-tl">{description.map((para, i) => <p key={i}>{para}</p>)}</div>
            </div>
          )}

          {highlights.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 font-display text-xl font-bold tracking-[-0.01em] sm:text-2xl">{d.products.highlights}</h2>
              <ul className="space-y-3">
                {highlights.map((h, i) => (
                  <li key={i} className="flex gap-3 text-ink-soft">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-white"><Check className="size-3.5" aria-hidden /></span>
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ideas.length > 0 && (
            <div className="mt-10 rounded-2xl border border-line bg-white p-5 shadow-[var(--shadow-xs)] sm:p-6">
              <h2 className="mb-4 inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-[-0.01em] sm:text-2xl"><span className="grid size-9 place-items-center rounded-xl bg-gold-soft text-gold"><Utensils className="size-[1.125rem]" aria-hidden /></span>{d.products.servingIdeas}</h2>
              <ul className="flex flex-wrap gap-2">
                {ideas.map((x, i) => <li key={i} className="rounded-full border border-line bg-cream px-3.5 py-1.5 text-sm font-medium text-ink-soft">{x}</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>

      {recipes.length > 0 && (
        <section className="container-x py-10 sm:py-14">
          <h2 className={`mb-5 sm:mb-8 ${H2_CLASS}`}>{d.products.usedIn}</h2>
          <Rail>
            {recipes.map((r) => (
              <RecipeCard key={r.slug} recipe={r} locale={locale} dict={d} stack />
            ))}
          </Rail>
        </section>
      )}

      <section id="enquire" className="container-x py-10 sm:py-14">
        <div className="reveal grid gap-6 rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:gap-10 sm:p-10 lg:grid-cols-[0.8fr_1.2fr] lg:rounded-[2rem]">
          <div>
            <p className="eyebrow mb-4">{d.cta.enquire}</p>
            <h2 className="font-display text-2xl font-bold tracking-[-0.02em] sm:text-3xl">{d.products.enquireTitle}</h2>
            <p className="mt-3 text-ink-soft">{d.products.enquireText}</p>
          </div>
          <InquiryForm
            labels={d.form}
            locale={locale}
            defaultKind="product"
            kinds={["product", "wholesale", "general"]}
            productSlug={product.slug}
            defaultMessage={`${name}${product.net_weight ? ` (${product.net_weight})` : ""}\n`}
            whatsappHref={whatsappLink(waText)}
          />
        </div>
      </section>

      <GuideLinks guides={guidesFor(await getGuides(), [category?.slug, series?.slug])} locale={locale} dict={d} />

      {related.length > 0 && (
        <section className="container-x py-10 sm:py-14">
          <h2 className={`mb-5 sm:mb-8 ${H2_CLASS}`}>{d.products.related}</h2>
          <ProductGrid products={related} rail />
        </section>
      )}

      {/* Phones/tablets: actions stay reachable at the bottom of the screen (replaces the floating WhatsApp button). */}
      <div data-sticky-cta className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgb(20_20_20/0.15)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <a href={whatsappLink(waText)} target="_blank" rel="noopener" className={buttonClass("whatsapp", "md", "px-3")}>
            <WhatsAppIcon /> {d.cta.whatsapp}
          </a>
          <a href="#enquire" className={buttonClass("primary", "md", "px-3")}>
            {d.cta.enquire}
          </a>
        </div>
      </div>

      <JsonLd data={jsonLd} />
    </>
  );
}
