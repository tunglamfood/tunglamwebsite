import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Factory, Layers, Package, ShieldCheck } from "lucide-react";
import { getDictionary } from "@/i18n";
import { hasLocale, localePath, t } from "@/lib/i18n";
import { getCatalog } from "@/lib/data";
import { pageMetadata } from "@/lib/seo";
import { whatsappLink } from "@/lib/site";
import { PageHeader } from "@/components/ui/page-header";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { ProductGrid, toCardData } from "@/components/product/product-card";

export const revalidate = 3600;
const WHY_ICONS = [Factory, Package, Layers, ShieldCheck];

export async function generateMetadata({ params }: PageProps<"/[lang]/wholesale">) {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return pageMetadata({ locale: lang, path: "/wholesale", title: d.wholesale.metaTitle, description: d.wholesale.metaDescription, absoluteTitle: false });
}

export default async function WholesalePage({ params }: PageProps<"/[lang]/wholesale">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const p = (path: string) => localePath(lang, path);
  const { products, categories, brandById, productsIn } = await getCatalog();
  const foodService = categories.find((c) => c.slug === "food-service-pack");
  const fsProducts = (foodService ? productsIn(foodService) : products.slice(0, 4))
    .slice(0, 8)
    .map((x) => toCardData(x, lang, x.brand_id ? brandById.get(x.brand_id) : undefined));

  return (
    <>
      <PageHeader
        crumbs={[
          { name: d.common.breadcrumbHome, href: p("/") },
          { name: d.nav.wholesale, href: p("/wholesale") },
        ]}
        title={d.wholesale.title}
        lead={d.wholesale.lead}
      />

      <section className="container-x grid gap-12 py-10 sm:py-16 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-line shadow-[var(--shadow-card)]">
          <Image src="/images/wholesale.webp" alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{d.wholesale.whoTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {d.wholesale.who.map((w) => (
              <li key={w} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 font-semibold">
                <Check className="size-5 shrink-0 text-leaf" aria-hidden />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-sand/50 py-12 sm:py-20">
        <div className="container-x">
          <h2 className="mb-6 font-display text-[1.75rem] font-semibold tracking-tight sm:mb-10 sm:text-4xl">{d.wholesale.whyTitle}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {d.wholesale.why.map((w, i) => {
              const Icon = WHY_ICONS[i % WHY_ICONS.length];
              return (
                <li key={w.title} className="reveal border border-line shadow-[var(--shadow-card)] flex items-start gap-4 rounded-2xl bg-white p-4 sm:block sm:p-6" data-dir="zoom">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold sm:mt-5">{w.title}</h3>
                    <p className="mt-1 text-ink-soft sm:mt-2">{w.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {fsProducts.length > 0 && foodService && (
        <section className="container-x py-12 sm:py-20">
          <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{t(foodService.name, lang)}</h2>
          <ProductGrid products={fsProducts} />
        </section>
      )}

      <section id="quote" className="container-x">
        <div className="grid gap-10 rounded-[1.5rem] border border-line bg-white p-5 sm:rounded-[2rem] sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">{d.wholesale.formTitle}</h2>
            <p className="mt-3 text-ink-soft">{d.wholesale.formText}</p>
          </div>
          <InquiryForm labels={d.form} locale={lang} defaultKind="wholesale" kinds={["wholesale"]} whatsappHref={whatsappLink()} />
        </div>
      </section>
    </>
  );
}
