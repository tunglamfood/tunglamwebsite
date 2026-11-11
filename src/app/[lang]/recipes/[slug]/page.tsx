import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChefHat, Clock, Flame, Lightbulb, Users } from "lucide-react";
import { getDictionary } from "@/i18n";
import { LOCALES, fmt, hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog, getRecipes } from "@/lib/data";
import { ORG_ID, absoluteUrl, pageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ProductGrid, toCardData } from "@/components/product/product-card";
import { RecipeCard } from "@/components/recipe/recipe-card";

export const revalidate = 3600;

const iso = (min?: number | null) => (min ? `PT${min}M` : undefined);

export async function generateStaticParams() {
  const recipes = await getRecipes();
  return LOCALES.flatMap((lang) => recipes.map((r) => ({ lang, slug: r.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/recipes/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const r = (await getRecipes()).find((x) => x.slug === slug);
  if (!r) return { robots: { index: false } };
  const img = mediaUrl(r.image_path);
  return pageMetadata({
    locale: lang,
    path: `/recipes/${slug}`,
    title: t(r.meta_title, lang) ?? t(r.title, lang) ?? slug,
    description: t(r.meta_description, lang) ?? t(r.excerpt, lang) ?? "",
    absoluteTitle: true,
    type: "article",
    publishedTime: r.published_at,
    modifiedTime: r.updated_at,
    image: img ? { url: img, width: r.image_width ?? undefined, height: r.image_height ?? undefined, alt: t(r.title, lang) } : null,
  });
}

export default async function RecipePage({ params }: PageProps<"/[lang]/recipes/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const [recipes, catalog] = await Promise.all([getRecipes(), getCatalog()]);
  const r = recipes.find((x) => x.slug === slug);
  if (!r) notFound();

  const title = t(r.title, lang) ?? r.slug;
  const img = mediaUrl(r.image_path);
  const total = (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
  const tips = t(r.tips, lang) ?? [];
  const used = r.product_slugs
    .map((s) => catalog.products.find((x) => x.slug === s))
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .map((x) => toCardData(x, lang, x.brand_id ? catalog.brandById.get(x.brand_id) : undefined));
  const more = recipes.filter((x) => x.id !== r.id).slice(0, 3);
  const url = p(`/recipes/${r.slug}`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: title,
    description: t(r.excerpt, lang),
    image: img ? [img] : undefined,
    author: { "@type": "Organization", "@id": ORG_ID, name: "Tung Lam Food" },
    publisher: { "@id": ORG_ID },
    datePublished: r.published_at,
    dateModified: r.updated_at,
    prepTime: iso(r.prep_minutes),
    cookTime: iso(r.cook_minutes),
    totalTime: iso(total),
    recipeYield: r.servings ? String(r.servings) : undefined,
    recipeCuisine: t(r.cuisine, lang),
    recipeCategory: t(r.course, lang),
    keywords: (t(r.keywords, lang) ?? []).join(", "),
    recipeIngredient: r.ingredients.flatMap((g) => t(g.items, lang) ?? []),
    recipeInstructions: r.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: t(s.title, lang) ?? undefined,
      text: t(s.text, lang),
      url: `${absoluteUrl(url)}#step-${i + 1}`,
    })),
    inLanguage: lang,
    mainEntityOfPage: absoluteUrl(url),
  };

  const meta = [
    r.prep_minutes ? { icon: Clock, label: d.recipes.prep, value: fmt(d.recipes.minutes, { n: r.prep_minutes }) } : null,
    r.cook_minutes ? { icon: Flame, label: d.recipes.cook, value: fmt(d.recipes.minutes, { n: r.cook_minutes }) } : null,
    r.servings ? { icon: Users, label: d.recipes.serves, value: String(r.servings) } : null,
    r.difficulty ? { icon: ChefHat, label: "", value: d.recipes.difficulty[r.difficulty as "easy" | "medium"] ?? r.difficulty } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

  return (
    <article>
      <div className="container-x pt-8">
        <Breadcrumbs
          items={[
            { name: d.common.breadcrumbHome, href: p("/") },
            { name: d.recipes.title, href: p("/recipes") },
            { name: title, href: url },
          ]}
        />
      </div>

      <header className="container-x grid items-center gap-6 py-6 sm:gap-10 sm:py-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="eyebrow mb-4">
            {t(r.cuisine, lang)} · {t(r.course, lang)}
          </p>
          <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg">{t(r.intro, lang) ?? t(r.excerpt, lang)}</p>
          <ul className="mt-6 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
            {meta.map((m, i) => (
              <li key={i} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm">
                <m.icon className="size-4 text-brand" aria-hidden />
                {m.label && <span className="text-muted">{m.label}</span>}
                <span className="font-semibold">{m.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">
            <time dateTime={r.published_at}>{new Date(r.published_at).toLocaleDateString(lang === "zh" ? "zh-CN" : lang === "ms" ? "ms-MY" : "en-MY", { day: "numeric", month: "long", year: "numeric" })}</time>
          </p>
        </div>
        {img && (
          <div className="relative order-first aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-line bg-sand shadow-[var(--shadow-card)] sm:rounded-[2rem] lg:order-none">
            <Image src={img} alt={title} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        )}
      </header>

      <div className="container-x grid gap-10 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-sand/50 p-5 sm:p-8">
            <h2 className="mb-5 font-display text-2xl font-semibold">{d.recipes.ingredients}</h2>
            <div className="space-y-6">
              {r.ingredients.map((g, gi) => (
                <div key={gi}>
                  {g.group && t(g.group, lang) && <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-brand">{t(g.group, lang)}</h3>}
                  <ul className="space-y-2">
                    {(t(g.items, lang) ?? []).map((it, i) => (
                      <li key={i} className="flex gap-3 border-b border-dashed border-line pb-2 text-ink-soft last:border-0">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <h2 className="mb-6 font-display text-2xl font-semibold">{d.recipes.method}</h2>
          <ol className="space-y-6">
            {r.steps.map((s, i) => (
              <li key={i} id={`step-${i + 1}`} className="flex gap-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-semibold text-white">{i + 1}</span>
                <div className="pt-1.5">
                  {s.title && t(s.title, lang) && <h3 className="mb-1 font-semibold text-ink">{t(s.title, lang)}</h3>}
                  <p className="leading-relaxed text-ink-soft">{t(s.text, lang)}</p>
                </div>
              </li>
            ))}
          </ol>

          {tips.length > 0 && (
            <div className="mt-10 rounded-2xl bg-gold-soft p-6">
              <h2 className="mb-3 inline-flex items-center gap-2 font-display text-xl font-semibold">
                <Lightbulb className="size-5 text-gold" aria-hidden />
                {d.recipes.tips}
              </h2>
              <ul className="list-disc space-y-2 pl-5 text-ink-soft">
                {tips.map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {used.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.recipes.productsUsed}</h2>
          <ProductGrid products={used} mobileLimit={4} />
        </section>
      )}

      {more.length > 0 && (
        <section className="container-x py-12">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.recipes.more}</h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {more.map((x) => (
              <div key={x.slug}>
                <RecipeCard recipe={x} locale={lang} dict={d} />
              </div>
            ))}
          </div>
        </section>
      )}

      <JsonLd data={jsonLd} />
    </article>
  );
}
