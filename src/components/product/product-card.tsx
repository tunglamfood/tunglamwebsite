import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Brand, Product } from "@/lib/data";
import { localePath, t, type Locale } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { Rail } from "@/components/ui/rail";

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
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-1.5 shadow-[var(--shadow-xs)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:p-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f4f3f1] sm:aspect-[4/5]">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
            className="object-contain p-3 mix-blend-multiply transition duration-500 ease-out group-hover:scale-[1.05] sm:p-6"
          />
        )}
        {product.brand && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-ink-soft shadow-[var(--shadow-xs)] sm:left-2.5 sm:top-2.5 sm:px-2 sm:text-[0.66rem]">
            {product.brand}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-2.5 sm:px-2.5 sm:pb-2 sm:pt-4">
        <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-ink sm:text-[0.975rem]">{product.name}</h3>
        {product.short && <p className="mt-1 hidden text-sm leading-snug text-muted sm:line-clamp-2">{product.short}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5 sm:pt-4">
          {product.netWeight ? (
            <span className="truncate rounded-md bg-sand px-1.5 py-0.5 text-[0.7rem] font-semibold text-ink-soft sm:px-2 sm:py-1 sm:text-xs">{product.netWeight}</span>
          ) : (
            <span />
          )}
          <span className="hidden size-8 shrink-0 place-items-center rounded-full border border-line text-ink-soft transition duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-white sm:grid">
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** `rail`: on phones show a swipeable row instead of the grid (for "featured"/"related" strips). */
export function ProductGrid({ products, priorityCount = 0, rail, cols = "md:grid-cols-3 xl:grid-cols-4" }: { products: ProductCardData[]; priorityCount?: number; rail?: boolean; cols?: string }) {
  if (rail) {
    return (
      <Rail grid="md:grid-cols-3 xl:grid-cols-4 sm:grid-cols-3" itemWidth="w-[44%]">
        {products.map((p, i) => (
          <ProductCard key={p.slug} product={p} priority={i < priorityCount} />
        ))}
      </Rail>
    );
  }
  return (
    <ul className={`grid grid-cols-2 gap-2.5 sm:gap-4 lg:gap-5 ${cols}`}>
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
