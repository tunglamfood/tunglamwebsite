import Image from "next/image";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Recipe } from "@/lib/data";
import { fmt, localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function RecipeCard({ recipe, locale, dict }: { recipe: Recipe; locale: Locale; dict: Dictionary }) {
  const img = mediaUrl(recipe.image_path);
  const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
  const title = t(recipe.title, locale) ?? recipe.slug;
  return (
    <Link href={localePath(locale, `/recipes/${recipe.slug}`)} className="group flex h-full overflow-hidden rounded-2xl bg-white sm:flex-col sm:rounded-[1.25rem] shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative min-h-28 w-[36%] shrink-0 overflow-hidden bg-sand sm:aspect-[4/3] sm:min-h-0 sm:w-auto">
        {img && (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 40vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4 sm:justify-start sm:gap-2 sm:p-5">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-brand">
          <span>{t(recipe.course, locale)}</span>
          {total > 0 && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock className="size-3.5" aria-hidden />
              {fmt(dict.recipes.minutes, { n: total })}
            </span>
          )}
        </div>
        <h3 className="line-clamp-3 font-display text-base font-semibold leading-snug text-ink group-hover:text-brand sm:text-xl">{title}</h3>
        <p className="hidden text-sm text-muted sm:line-clamp-2">{t(recipe.excerpt, locale)}</p>
      </div>
    </Link>
  );
}
