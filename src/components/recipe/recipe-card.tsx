import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Clock } from "lucide-react";
import type { Recipe } from "@/lib/data";
import { fmt, localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * `stack` (default false): phones show a compact row (photo left, text right) — good for lists.
 * With `stack`, the card is always photo-on-top (used inside swipeable rails).
 */
export function RecipeCard({ recipe, locale, dict, stack }: { recipe: Recipe; locale: Locale; dict: Dictionary; stack?: boolean }) {
  const img = mediaUrl(recipe.image_path);
  const total = (recipe.prep_minutes ?? 0) + (recipe.cook_minutes ?? 0);
  const title = t(recipe.title, locale) ?? recipe.slug;
  return (
    <Link
      href={localePath(locale, `/recipes/${recipe.slug}`)}
      className={clsx(
        "group flex h-full gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-xs)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:flex-col sm:p-2",
        stack && "flex-col",
      )}
    >
      <div className={clsx("relative shrink-0 overflow-hidden rounded-xl bg-sand sm:aspect-[4/3] sm:w-auto", stack ? "aspect-[4/3] w-full" : "aspect-square w-28")}>
        {img && (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 80vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          />
        )}
        {t(recipe.course, locale) && (
          <span className="absolute left-2 top-2 hidden rounded-md bg-white/95 px-2 py-0.5 text-[0.66rem] font-semibold uppercase tracking-wider text-ink-soft shadow-[var(--shadow-xs)] sm:inline-block">
            {t(recipe.course, locale)}
          </span>
        )}
      </div>
      <div className={clsx("flex min-w-0 flex-1 flex-col gap-1.5 px-2.5 py-2 sm:justify-start sm:gap-2 sm:px-3 sm:pb-3 sm:pt-4", !stack && "justify-center")}>
        <div className="flex items-center gap-2.5 text-xs font-medium text-muted">
          <span className={clsx("font-semibold uppercase tracking-wider text-brand", !stack && "sm:hidden")}>{t(recipe.course, locale)}</span>
          {total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {fmt(dict.recipes.minutes, { n: total })}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 font-display text-[0.975rem] font-bold leading-snug tracking-[-0.01em] text-ink sm:line-clamp-3 sm:text-lg">{title}</h3>
        <p className="hidden text-sm leading-snug text-muted sm:line-clamp-2">{t(recipe.excerpt, locale)}</p>
      </div>
    </Link>
  );
}
