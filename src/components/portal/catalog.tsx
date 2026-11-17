"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ArrowRight, Check, LayoutGrid, Minus, Plus, Search, ShoppingBasket, ShoppingCart, Star, X } from "lucide-react";
import { useCart } from "./cart";
import type { CatalogProduct, UsualItem } from "@/lib/portal/data";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";
import { PRIMARY } from "./bits";
import { ZoomImage } from "@/components/ui/zoom-image";

const CATS = ["tofu", "steamboat", "dessert", "grocery"] as const;
type Cat = (typeof CATS)[number];

/** A photo for each category tab (grocery has no photo, it gets an icon). */
const CAT_IMAGE: Partial<Record<Cat, string>> = {
  tofu: "/images/series-tofu.webp",
  steamboat: "/images/series-steamboat.webp",
  dessert: "/images/series-dessert.webp",
};

/** How often a product was ordered: its most-ordered variant. */
const usualScore = (p: CatalogProduct, usual: Record<string, UsualItem>) =>
  Math.max(0, ...p.variants.map((v) => usual[v.itemCode]?.times ?? 0));

function CatThumb({ cat, active }: { cat: string; active: boolean }) {
  const img = CAT_IMAGE[cat as Cat];
  if (img) {
    return (
      <span className="relative size-7 shrink-0 overflow-hidden rounded-full ring-2 ring-white">
        <Image src={img} alt="" fill sizes="28px" className="object-cover" />
      </span>
    );
  }
  const Icon = cat === "usual" ? Star : cat === "all" ? LayoutGrid : ShoppingBasket;
  return (
    <span className={clsx("grid size-7 shrink-0 place-items-center rounded-full", active ? "bg-white text-brand" : cat === "usual" ? "bg-amber-50 text-amber-600" : "bg-sand text-ink-soft")}>
      <Icon className={clsx("size-3.5", cat === "usual" && "fill-amber-400 text-amber-400")} aria-hidden />
    </span>
  );
}

export function Catalog({
  products,
  usual,
  startUsual,
  startQuery = "",
  scope,
  currency,
  labels,
  cartLabel,
}: {
  products: CatalogProduct[];
  usual: Record<string, UsualItem>;
  startUsual: boolean;
  startQuery?: string;
  scope: string;
  currency: string;
  labels: PortalDict["products"];
  cartLabel: string;
}) {
  const [cat, setCat] = useState<string>(startUsual ? "usual" : "all");
  const [q, setQ] = useState(startQuery);
  const { count } = useCart(scope);
  const present = CATS.filter((c) => products.some((p) => p.category === c));
  const usualCount = products.filter((p) => usualScore(p, usual) > 0).length;
  const needle = q.trim().toLowerCase();

  const shown = useMemo(() => {
    const list = products.filter(
      (p) =>
        (cat === "all" || (cat === "usual" ? usualScore(p, usual) > 0 : p.category === cat)) &&
        (!needle || `${p.name} ${p.brand} ${p.variants.map((v) => `${v.itemCode} ${v.label}`).join(" ")}`.toLowerCase().includes(needle)),
    );
    return cat === "usual" ? list.sort((a, b) => usualScore(b, usual) - usualScore(a, usual)) : list;
  }, [products, usual, cat, needle]);

  const tabs = [
    ...(usualCount ? [{ key: "usual", label: labels.usual, n: usualCount }] : []),
    { key: "all", label: labels.all, n: products.length },
    ...present.map((c) => ({ key: c, label: labels.categories[c], n: products.filter((p) => p.category === c).length })),
  ];

  // "All" without a search: one section per category, so the list reads like a catalogue.
  const sections =
    cat === "all" && !needle
      ? present.map((c) => ({ key: c, title: labels.categories[c], items: shown.filter((p) => p.category === c) })).filter((s) => s.items.length)
      : [{ key: cat, title: "", items: shown }];

  const card = (p: CatalogProduct) => (
    <li key={p.id}>
      <ProductCard product={p} usual={usual} scope={scope} currency={currency} labels={labels} isUsual={usualScore(p, usual) > 0} />
    </li>
  );

  return (
    // Phones: leave room under the last row for the floating cart bar.
    <div className={clsx(count > 0 && "pb-20 lg:pb-0")}>
      {/* Toolbar: search + categories (sticks under the top bar) */}
      <div className="glass-bar sticky top-14 z-10 -mx-4 mb-5 border-b px-4 pb-3 pt-3 sm:-mx-6 sm:px-6 lg:top-16 lg:-mx-8 lg:px-8">
        <label className="relative block lg:max-w-md">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.search}
            className="h-11 w-full rounded-xl border border-white/80 bg-white/75 pl-10 pr-10 text-[0.95rem] outline-none transition placeholder:text-muted/80 focus:border-ink/30 focus:ring-4 focus:ring-ink/5 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear" className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-sand hover:text-ink">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden" role="tablist">
          {tabs.map((t) => {
            const on = cat === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setCat(t.key)}
                className={clsx(
                  "flex h-11 shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-semibold transition-colors duration-150",
                  on ? "border-brand/30 bg-white text-brand-700" : "border-white/70 bg-white/55 text-ink-soft backdrop-blur hover:bg-white/80 hover:text-ink",
                )}
              >
                <CatThumb cat={t.key} active={on} />
                {t.label}
                <span className={clsx("rounded-full px-1.5 text-[0.7rem] font-semibold leading-5 tabular-nums", on ? "bg-brand text-white" : "bg-sand text-muted")}>{t.n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="glass rounded-2xl p-10 text-center text-muted">{labels.empty}</p>
      ) : (
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.key}>
              {s.title ? (
                <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-bold tracking-[-0.015em] text-ink">
                  <CatThumb cat={s.key} active={false} />
                  {s.title}
                  <span className="rounded-full bg-sand px-2 text-xs font-semibold leading-6 text-muted tabular-nums">{s.items.length}</span>
                </h2>
              ) : (
                <p className="mb-3 text-sm text-muted" aria-live="polite">
                  {pfmt(labels.count, { n: s.items.length })}
                </p>
              )}
              <ul className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">{s.items.map(card)}</ul>
            </section>
          ))}
        </div>
      )}

      {/* Phones: floating shortcut to the cart */}
      {count > 0 && (
        <Link
          href="/portal/cart"
          className={clsx("fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex animate-fade-up items-center gap-3 rounded-2xl px-4 py-3 lg:hidden", PRIMARY)}
        >
          <span className="relative grid size-9 place-items-center rounded-xl bg-white/15">
            <ShoppingCart className="size-[1.125rem]" aria-hidden />
            <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-white px-1 text-center text-[0.68rem] font-bold leading-5 text-brand ring-2 ring-brand">{count}</span>
          </span>
          <span className="flex-1 text-sm font-semibold">{cartLabel}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold">
            {labels.viewCart} <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      )}
    </div>
  );
}

/** − qty + bound straight to the cart; the number can also be typed. */
function Stepper({ qty, onChange }: { qty: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft !== null) {
      const n = Number(draft);
      if (n > 0) onChange(Math.min(100000, n));
      setDraft(null);
    }
  };
  return (
    <div className="flex h-9 w-full items-center rounded-xl border border-emerald-300 bg-emerald-50/60 sm:h-10">
      <button type="button" aria-label="−" onClick={() => onChange(qty - 1)} className="grid h-full w-9 shrink-0 place-items-center rounded-l-xl text-emerald-800 transition-colors hover:bg-emerald-100 sm:w-10">
        <Minus className="size-4" />
      </button>
      <input
        inputMode="numeric"
        value={draft ?? String(qty)}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 6))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        className="min-w-0 flex-1 bg-transparent text-center text-sm font-bold tabular-nums text-emerald-900 outline-none"
        aria-label="Qty"
      />
      <button type="button" aria-label="+" onClick={() => onChange(qty + 1)} className="grid h-full w-9 shrink-0 place-items-center rounded-r-xl text-emerald-800 transition-colors hover:bg-emerald-100 sm:w-10">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function ProductCard({
  product, usual, scope, currency, labels, isUsual,
}: {
  product: CatalogProduct; usual: Record<string, UsualItem>; scope: string; currency: string; labels: PortalDict["products"]; isUsual: boolean;
}) {
  const { setQty, qtyOf } = useCart(scope);
  // Open on the pack size already in the cart, else the one this dealer usually takes.
  const usualVariant =
    product.variants.find((v) => qtyOf(v.itemCode) > 0) ??
    [...product.variants].sort((a, b) => (usual[b.itemCode]?.times ?? 0) - (usual[a.itemCode]?.times ?? 0))[0];
  const [code, setCode] = useState(usualVariant?.itemCode ?? "");
  const variant = product.variants.find((v) => v.itemCode === code) ?? product.variants[0];
  const inCart = qtyOf(variant.itemCode);
  const image = variant.image ?? product.image;
  const usualHere = usual[variant.itemCode];
  // Everything from this product that is in the cart, across pack sizes.
  const carted = product.variants.map((v) => ({ v, n: qtyOf(v.itemCode) })).filter((x) => x.n > 0);
  const anyInCart = carted.length > 0;

  return (
    <div
      className={clsx(
        "glass flex h-full flex-col rounded-2xl p-1.5 transition duration-300 sm:p-2",
        anyInCart ? "border-emerald-300 ring-1 ring-emerald-200/70" : "hover:bg-white/80",
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white/70">
        {image ? (
          <ZoomImage src={image} alt={`${product.name} · ${variant.label}`} className="h-full">
            <span className="relative block aspect-square w-full">
              <Image src={image} alt={product.name} fill sizes="(min-width: 1280px) 240px, (min-width: 768px) 30vw, 46vw" className="object-contain p-3 transition duration-300 group-hover/zoom:scale-105 sm:p-5" />
            </span>
          </ZoomImage>
        ) : (
          <div className="grid h-full place-items-center font-display text-3xl font-bold text-muted/40">{(product.brand || product.name).slice(0, 2)}</div>
        )}
        {anyInCart && (
          <span className="pointer-events-none absolute left-1.5 top-1.5 z-[1] inline-flex items-center gap-1 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[0.68rem] font-semibold text-white">
            <Check className="size-3" aria-hidden /> {labels.inCartShort}
          </span>
        )}
        {isUsual && (
          <span className="pointer-events-none absolute right-1.5 top-1.5 z-[1] grid size-6 place-items-center rounded-full bg-white/95" title={labels.usual}>
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-0.5 pt-2.5 sm:px-1.5 sm:pt-3">
        {product.brand && <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted sm:text-[0.68rem]">{product.brand}</p>}
        <h3 className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug text-ink sm:text-[0.95rem]">{product.name}</h3>

        {product.variants.length > 1 ? (
          <div className="mt-2 flex flex-wrap gap-1.5 pt-1" role="radiogroup" aria-label={product.name}>
            {product.variants.map((v) => {
              const on = v.itemCode === variant.itemCode;
              const n = qtyOf(v.itemCode);
              return (
                <button
                  key={v.itemCode}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCode(v.itemCode)}
                  className={clsx(
                    "relative rounded-lg border px-2 py-1 text-[0.68rem] font-semibold transition-colors duration-150 sm:text-xs",
                    on
                      ? "border-brand bg-brand-50 text-brand-700 ring-1 ring-brand/15"
                      : n > 0
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-white/80 bg-white/70 text-ink-soft hover:bg-white hover:text-ink",
                  )}
                >
                  {v.label}
                  {n > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-emerald-600 px-1 text-center text-[0.6rem] font-bold leading-4 text-white ring-2 ring-white tabular-nums">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-0.5 truncate text-xs text-ink-soft">{variant.label}</p>
        )}

        {/* What is already in the cart from this product (all pack sizes) */}
        {anyInCart && product.variants.length > 1 && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-2 py-1.5 text-[0.68rem] leading-snug text-emerald-800 sm:text-xs">
            <span className="font-semibold">{labels.inCartShort}:</span> {carted.map((x) => `${x.v.label} × ${x.n}`).join(" · ")}
          </p>
        )}

        <div className="mt-auto pt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-1">
            {variant.promo && variant.promo.minQty <= 1 ? (
              <>
                <span className="font-display text-base font-bold tabular-nums text-brand sm:text-lg">{money(variant.promo.price, currency)}</span>
                {variant.price != null && <span className="text-[0.68rem] tabular-nums text-muted line-through sm:text-xs">{money(variant.price, currency)}</span>}
                {variant.uom && <span className="text-[0.68rem] text-muted sm:text-xs">{pfmt(labels.per, { uom: variant.uom.toLowerCase() })}</span>}
              </>
            ) : variant.price != null ? (
              <>
                <span className="font-display text-base font-bold tabular-nums text-ink sm:text-lg">{money(variant.price, currency)}</span>
                {variant.uom && <span className="text-[0.68rem] text-muted sm:text-xs">{pfmt(labels.per, { uom: variant.uom.toLowerCase() })}</span>}
              </>
            ) : (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[0.68rem] font-medium leading-tight text-amber-800">{labels.priceTbc}</span>
            )}
          </div>
          {variant.promo && (
            <p className="mt-1 inline-flex max-w-full items-start gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-semibold leading-snug text-brand sm:text-[0.7rem]">
              <span className="mt-px shrink-0 rounded bg-brand px-1 text-[0.6rem] uppercase text-white">{labels.promo}</span>
              <span className="line-clamp-2">
                {variant.promo.title}
                {variant.promo.minQty > 1 ? ` · ${money(variant.promo.price, currency)} × ${variant.promo.minQty}+` : ""}
              </span>
            </p>
          )}
          <p className="mt-0.5 truncate text-[0.65rem] text-muted sm:text-[0.7rem]">
            <span className="tabular-nums">{variant.itemCode}</span>
            {usualHere && <span className="font-medium text-ink-soft"> · {pfmt(labels.usually, { qty: usualHere.lastQty })}</span>}
          </p>
          <div className="mt-2.5">
            {inCart > 0 ? (
              <Stepper qty={inCart} onChange={(n) => setQty(variant.itemCode, n)} />
            ) : (
              <button
                type="button"
                onClick={() => setQty(variant.itemCode, usualHere?.lastQty || 1)}
                className={clsx("inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition duration-150 active:scale-[0.98] sm:h-10", PRIMARY)}
              >
                <ShoppingCart className="size-4" aria-hidden /> {labels.add}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
