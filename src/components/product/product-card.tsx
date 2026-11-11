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
      className="group card flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-line/60 bg-white">
        {product.image && (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
            className="object-contain p-5 transition duration-500 group-hover:scale-[1.04]"
          />
        )}
        {product.brand && (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft backdrop-blur">
            {product.brand}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <h3 className="font-semibold leading-snug text-ink group-hover:text-brand">{product.name}</h3>
        {product.short && <p className="line-clamp-2 text-sm text-muted">{product.short}</p>}
        <div className="mt-auto flex items-center justify-between pt-3 text-sm">
          {product.netWeight ? (
            <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink-soft">{product.netWeight}</span>
          ) : (
            <span />
          )}
          <ArrowUpRight className="size-5 text-muted transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.slug}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
