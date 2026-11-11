import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { PageHeader } from "@/components/ui/page-header";
import { brandLogoSrc } from "@/components/brand/brand-logos";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[lang]/brands">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/brands", title: d.brands.metaTitle, description: d.brands.metaDescription });
}

export default async function BrandsPage({ params }: PageProps<"/[lang]/brands">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const { brands, products } = await getCatalog();

  return (
    <>
      <PageHeader
        cut="egg-tofu"
        cut2="chili"
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.brands.title, href: p("/brands") },
        ]}
        title={d.brands.title}
        lead={d.brands.intro}
      />
      <section className="container-x grid gap-6 py-12 md:grid-cols-2">
        {brands.map((b) => {
          const logo = brandLogoSrc(b);
          const count = products.filter((x) => x.brand_id === b.id).length;
          return (
            <Link
              key={b.slug}
              href={p(`/brands/${b.slug}`)}
              className="group card flex flex-col gap-6 p-8 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center"
            >
              <div className="relative h-28 w-40 shrink-0">
                {logo && <Image src={logo} alt={`${b.name} logo`} fill sizes="160px" className="object-contain" />}
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold group-hover:text-brand">{b.name}</h2>
                <p className="mt-1 text-ink-soft">{t(b.tagline, lang)}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                  {d.home.stats.products}: {count} <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
                </p>
              </div>
            </Link>
          );
        })}
      </section>
    </>
  );
}
