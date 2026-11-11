import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/privacy", title: d.privacy.metaTitle, description: d.privacy.metaDescription });
}

/** English-only legal text (PDPA 2010). Translations can be added once reviewed by the company. */
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.privacy.title, href: p("/privacy") },
        ]}
        title={d.privacy.title}
      />
      <section className="container-x max-w-3xl py-16" lang="en">
        <div className="prose-tl space-y-6 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink">
          <p>
            This policy explains how {SITE.legalName} ({SITE.registrationNo}) (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles personal data
            submitted through this website, in line with Malaysia&rsquo;s Personal Data Protection Act 2010 (PDPA).
          </p>
          <h2>What we collect</h2>
          <p>
            When you send an enquiry we collect the details you provide — your name, company, phone number, email address and message — together
            with the page you sent it from and basic technical information (browser type). We also use privacy-friendly, cookie-less analytics to
            understand overall website traffic.
          </p>
          <h2>How we use it</h2>
          <p>
            We use your details only to respond to your enquiry, to provide quotations and product information you request, and to process job
            applications. We do not sell your personal data.
          </p>
          <h2>Storage and retention</h2>
          <p>
            Enquiries are stored securely with our cloud database provider. We keep them only as long as needed for the purposes above or as
            required by law.
          </p>
          <h2>Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any time by contacting us at{" "}
            <a className="font-semibold text-brand" href={`mailto:${SITE.email}`}>{SITE.email}</a>.
          </p>
          <h2>Contact</h2>
          <p>
            {SITE.legalName}, 3, Persiaran Perusahaan Kledang Utara 1/1, Kawasan Perindustrian Chandan Raya, 31450 Menglembu, Perak, Malaysia.
          </p>
        </div>
      </section>
    </>
  );
}
