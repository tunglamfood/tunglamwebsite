import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { BookOpen } from "lucide-react";
import type { Guide } from "@/lib/data";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { Rail } from "@/components/ui/rail";
import { H2_CLASS } from "@/components/ui/section-heading";

export function GuideCard({ guide, locale, dict, headingLevel = "h3", stack }: { guide: Guide; locale: Locale; dict: Dictionary; headingLevel?: "h2" | "h3"; stack?: boolean }) {
  const title = t(guide.title, locale) ?? guide.slug;
  const img = mediaUrl(guide.image_path);
  const Heading = headingLevel;
  return (
    <Link
      href={localePath(locale, `/guides/${guide.slug}`)}
      className={clsx(
        "group flex h-full gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-xs)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:flex-col sm:p-2",
        stack && "flex-col",
      )}
    >
      <div className={clsx("relative shrink-0 overflow-hidden rounded-xl bg-sand sm:aspect-[16/9] sm:w-auto", stack ? "aspect-[16/9] w-full" : "aspect-square w-28")}>
        {img && (
          <Image
            src={img}
            alt={t(guide.image_alt, locale) ?? title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 80vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
      </div>
      <div className={clsx("flex min-w-0 flex-1 flex-col gap-1.5 px-2.5 py-2 sm:justify-start sm:gap-2 sm:px-3 sm:pb-3 sm:pt-4", !stack && "justify-center")}>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
          <BookOpen className="size-3.5" aria-hidden />
          {dict.guides.label}
        </span>
        <Heading className="line-clamp-2 font-display text-[0.975rem] font-bold leading-snug tracking-[-0.01em] text-ink sm:line-clamp-3 sm:text-lg">{title}</Heading>
        <p className="hidden text-sm leading-snug text-muted sm:line-clamp-2">{t(guide.lead, locale)}</p>
      </div>
    </Link>
  );
}

/** A row of guide cards under a heading, for category and product pages (swipeable on phones). */
export function GuideLinks({ guides, locale, dict }: { guides: Guide[]; locale: Locale; dict: Dictionary }) {
  if (guides.length === 0) return null;
  return (
    <section className="container-x py-10 sm:py-14">
      <h2 className={`mb-5 sm:mb-8 ${H2_CLASS}`}>{dict.guides.learnMore}</h2>
      <Rail>
        {guides.map((g) => (
          <GuideCard key={g.slug} guide={g} locale={locale} dict={dict} stack />
        ))}
      </Rail>
    </section>
  );
}
