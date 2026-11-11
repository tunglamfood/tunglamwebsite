import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { InquiryForm } from "@/components/forms/inquiry-form";

export async function generateMetadata({ params }: PageProps<"/[lang]/careers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/careers", title: d.careers.metaTitle, description: d.careers.metaDescription });
}

export default async function CareersPage({ params }: PageProps<"/[lang]/careers">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.nav.careers, href: p("/careers") },
        ]}
        title={d.careers.title}
        lead={d.careers.lead}
      />
      <section className="container-x grid gap-10 py-10 sm:py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="prose-tl text-lg">{d.careers.body}</p>
        </div>
        <div className="rounded-[1.5rem] border border-line bg-white p-5 sm:rounded-[2rem] sm:p-10">
          <h2 className="mb-6 font-display text-2xl font-semibold">{d.careers.formTitle}</h2>
          <InquiryForm labels={d.form} locale={lang} defaultKind="career" kinds={["career"]} whatsappHref={whatsappLink()} />
        </div>
      </section>
    </>
  );
}
