import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Guide } from "@/lib/data";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export function GuideCard({ guide, locale, dict, headingLevel = "h3" }: { guide: Guide; locale: Locale; dict: Dictionary; headingLevel?: "h2" | "h3" }) {
  const title = t(guide.title, locale) ?? guide.slug;
  const img = mediaUrl(guide.image_path);
  const Heading = headingLevel;
  return (
    <Link
      href={localePath(locale, `/guides/${guide.slug}`)}
      className="group flex h-full overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:flex-col sm:rounded-[1.25rem]"
    >
      <div className="relative min-h-28 w-[36%] shrink-0 overflow-hidden bg-sand sm:aspect-[16/9] sm:min-h-0 sm:w-auto">
        {img && (
          <Image
            src={img}
            alt={t(guide.image_alt, locale) ?? title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 40vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4 sm:justify-start sm:gap-2 sm:p-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
          <BookOpen className="size-3.5" aria-hidden />
          {dict.guides.label}
        </span>
        <Heading className="line-clamp-3 font-display text-base font-semibold leading-snug text-ink group-hover:text-brand sm:text-xl">{title}</Heading>
        <p className="hidden text-sm text-muted sm:line-clamp-2">{t(guide.lead, locale)}</p>
      </div>
    </Link>
  );
}

/** A row of guide cards under a heading, for category and product pages. */
export function GuideLinks({ guides, locale, dict }: { guides: Guide[]; locale: Locale; dict: Dictionary }) {
  if (guides.length === 0) return null;
  return (
    <section className="container-x py-12">
      <h2 className="mb-6 font-display text-3xl font-semibold tracking-tight">{dict.guides.learnMore}</h2>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {guides.map((g) => (
          <GuideCard key={g.slug} guide={g} locale={locale} dict={dict} />
        ))}
      </div>
    </section>
  );
}
