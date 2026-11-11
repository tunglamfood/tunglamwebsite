import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Brand, Product } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export type ProductCardData = {
  slug: string;
  href: string;
  name: string;
  short: string;
  image: string | null;
  brand: string | null;
  netWeight: string | null;
  seriesSlug: string | null;
  brandSlug: string | null;
};

/** Serializable card data (safe to pass to client components). */
export function toCardData(p: Product, locale: Locale, brand?: Brand, seriesSlug?: string | null): ProductCardData {
  return {
    slug: p.slug,
    href: localePath(locale, `/products/${p.slug}`),
    name: t(p.name, locale) ?? p.slug,
    short: t(p.short, locale) ?? "",
    image: mediaUrl(p.images[0]?.path),
    brand: brand?.name ?? null,
    netWeight: p.net_weight,
    seriesSlug: seriesSlug ?? null,
    brandSlug: brand?.slug ?? null,
  };
}

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  return (
    <Link
      href={product.href}
      className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-square overflow-hidden border-b border-line/60 bg-white sm:aspect-[4/5]">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
            className="object-contain p-1.5 transition duration-500 group-hover:scale-105 sm:p-5"
          />
        )}
        {product.brand && (
          <span className="absolute left-2 top-2 rounded-full bg-cream px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink-soft sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[0.7rem]">
            {product.brand}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-5">
        <h3 className="line-clamp-3 text-[0.9rem] font-semibold leading-snug text-ink group-hover:text-brand sm:text-base">{product.name}</h3>
        {product.short && <p className="hidden text-sm text-muted sm:line-clamp-2">{product.short}</p>}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs sm:pt-3 sm:text-sm">
          {product.netWeight ? (
            <span className="rounded-full bg-cream px-2 py-0.5 font-medium text-ink-soft sm:px-2.5 sm:py-1">{product.netWeight}</span>
          ) : (
            <span />
          )}
          <span className="grid size-7 place-items-center rounded-full bg-cream text-ink-soft transition group-hover:bg-brand group-hover:text-white sm:size-8">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** `carousel`: on phones, show a swipeable row instead of a long 2-column stack. */
export function ProductGrid({ products, priorityCount = 0, carousel }: { products: ProductCardData[]; priorityCount?: number; carousel?: boolean }) {
  return (
    <ul
      className={
        carousel
          ? "-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
          : "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((p, i) => (
        <li key={p.slug} className={carousel ? "w-[47%] shrink-0 snap-start sm:w-auto" : undefined}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
