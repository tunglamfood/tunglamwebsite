import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getRecipes } from "@/lib/data";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { PageHeader } from "@/components/ui/page-header";
import { RecipeCard } from "@/components/recipe/recipe-card";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/recipes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/recipes", title: d.recipes.metaTitle, description: d.recipes.metaDescription });
}

export default async function RecipesPage({ params }: PageProps<"/[lang]/recipes">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const recipes = await getRecipes();
  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: localePath(lang) },
          { name: d.recipes.title, href: localePath(lang, "/recipes") },
        ]}
        title={d.recipes.title}
        lead={d.recipes.intro}
      />
      <section className="container-x grid gap-5 py-8 sm:py-12 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <RecipeCard key={r.slug} recipe={r} locale={lang} dict={d} />
        ))}
      </section>
      <JsonLd
        data={itemListJsonLd(
          recipes.map((r) => ({ name: t(r.title, lang) ?? r.slug, url: localePath(lang, `/recipes/${r.slug}`), image: mediaUrl(r.image_path) })),
        )}
      />
    </>
  );
}
