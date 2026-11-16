import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath } from "@/lib/i18n";
import { GUIDES } from "@/lib/guides";
import { absoluteUrl, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { GuideCard } from "@/components/guide/guide-card";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/guides">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/guides", title: d.guides.metaTitle, description: d.guides.metaDescription });
}

export default async function GuidesPage({ params }: PageProps<"/[lang]/guides">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.guides.title, href: p("/guides") },
        ]}
        title={d.guides.title}
        lead={d.guides.intro}
      />
      <section className="container-x grid gap-5 py-8 sm:grid-cols-2 sm:py-12 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <GuideCard key={g.slug} guide={g} locale={lang} dict={d} headingLevel="h2" />
        ))}
      </section>
      <JsonLd
        data={itemListJsonLd(GUIDES.map((g) => ({ name: g.text[lang].title, url: p(`/guides/${g.slug}`), image: absoluteUrl(g.image.src) })))}
      />
    </>
  );
}
