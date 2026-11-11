import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getSiteFaqs } from "@/lib/data";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { FaqList } from "@/components/ui/faq-list";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import Link from "next/link";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/faq", title: d.faq.metaTitle, description: d.faq.metaDescription });
}

export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const faqs = await getSiteFaqs();
  const groups = (["products", "ordering", "company"] as const)
    .map((g) => ({
      key: g,
      title: d.faq.groups[g],
      items: faqs.filter((f) => f.grp === g).map((f) => ({ q: t(f.question, lang) ?? "", a: t(f.answer, lang) ?? "" })),
    }))
    .filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        cut="egg-tofu"
        cut2="chili"
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.nav.faq, href: p("/faq") },
        ]}
        title={d.faq.title}
      />
      <section className="container-x max-w-4xl space-y-12 py-10 sm:py-16">
        {groups.map((g) => (
          <div key={g.key}>
            <h2 className="mb-5 font-display text-2xl font-semibold">{g.title}</h2>
            <FaqList items={g.items} withSchema={false} />
          </div>
        ))}
        <div className="rounded-[1.5rem] bg-ink p-6 text-white sm:rounded-[2rem] sm:p-10">
          <h2 className="font-display text-2xl font-semibold">{d.faq.stillTitle}</h2>
          <p className="mt-2 text-white/75">{d.faq.stillText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "md")}>
              <WhatsAppIcon /> {d.cta.whatsapp}
            </a>
            <Link href={p("/contact")} className={buttonClass("light", "md")}>{d.nav.contact}</Link>
          </div>
        </div>
      </section>
      <JsonLd data={faqJsonLd(groups.flatMap((g) => g.items))} />
    </>
  );
}
