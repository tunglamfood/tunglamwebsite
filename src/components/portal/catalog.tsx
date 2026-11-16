"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Minus, Plus, Search, Star } from "lucide-react";
import { useCart } from "./cart";
import type { CatalogProduct, UsualItem } from "@/lib/portal/data";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";

const CATS = ["tofu", "steamboat", "dessert", "grocery"] as const;

/** How often a product was ordered: its most-ordered variant. */
const usualScore = (p: CatalogProduct, usual: Record<string, UsualItem>) =>
  Math.max(0, ...p.variants.map((v) => usual[v.itemCode]?.times ?? 0));

export function Catalog({
  products,
  usual,
  startUsual,
  scope,
  currency,
  labels,
}: {
  products: CatalogProduct[];
  usual: Record<string, UsualItem>;
  startUsual: boolean;
  scope: string;
  currency: string;
  labels: PortalDict["products"];
}) {
  const [cat, setCat] = useState<string>(startUsual ? "usual" : "all");
  const [q, setQ] = useState("");
  const present = CATS.filter((c) => products.some((p) => p.category === c));
  const hasUsual = products.some((p) => usualScore(p, usual) > 0);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (cat === "all" || (cat === "usual" ? usualScore(p, usual) > 0 : p.category === cat)) &&
        (!needle || `${p.name} ${p.brand} ${p.variants.map((v) => `${v.itemCode} ${v.label}`).join(" ")}`.toLowerCase().includes(needle)),
    );
    return cat === "usual" ? list.sort((a, b) => usualScore(b, usual) - usualScore(a, usual)) : list;
  }, [products, usual, cat, q]);

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-4 mb-5 space-y-3 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur sm:top-16">
        <label className="relative block">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.search}
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {hasUsual && (
            <button
              type="button"
              onClick={() => setCat("usual")}
              className={clsx(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition",
                cat === "usual" ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink/30",
              )}
            >
              <Star className="size-3.5" aria-hidden /> {labels.usual}
            </button>
          )}
          {["all", ...present].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={clsx(
                "h-9 shrink-0 rounded-full px-4 text-sm font-medium transition",
                cat === c ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-ink/30",
              )}
            >
              {c === "all" ? labels.all : labels.categories[c as (typeof CATS)[number]]}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-sm text-muted">{pfmt(labels.count, { n: shown.length })}</p>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-line bg-white p-10 text-center text-muted">{labels.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} usual={usual} scope={scope} currency={currency} labels={labels} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductCard({
  product, usual, scope, currency, labels,
}: {
  product: CatalogProduct; usual: Record<string, UsualItem>; scope: string; currency: string; labels: PortalDict["products"];
}) {
  const { setQty, qtyOf } = useCart(scope);
  // Open on the pack size this dealer usually takes, at the quantity they took last time.
  const usualVariant = [...product.variants].sort((a, b) => (usual[b.itemCode]?.times ?? 0) - (usual[a.itemCode]?.times ?? 0))[0];
  const startQty = (c: string) => Math.max(1, qtyOf(c) || usual[c]?.lastQty || 1);
  const [code, setCode] = useState(usualVariant?.itemCode ?? "");
  const variant = product.variants.find((v) => v.itemCode === code) ?? product.variants[0];
  const inCart = qtyOf(variant.itemCode);
  const [qty, setLocalQty] = useState(() => startQty(code));
  const [saved, setSaved] = useState(false);
  const image = variant.image ?? product.image;
  const usualHere = usual[variant.itemCode];

  const pickVariant = (c: string) => {
    setCode(c);
    setLocalQty(startQty(c));
    setSaved(false);
  };

  return (
    <div className="flex h-full gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-col sm:p-4">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream sm:aspect-[4/3] sm:size-auto sm:w-full">
        {image ? (
          <Image src={image} alt={product.name} fill sizes="(min-width: 640px) 320px, 96px" className="object-contain p-2" />
        ) : (
          <div className="grid h-full place-items-center font-display text-2xl font-semibold text-muted/60">{(product.brand || product.name).slice(0, 2)}</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {product.brand && <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{product.brand}</p>}
        <h3 className="font-semibold leading-snug text-ink">{product.name}</h3>

        {product.variants.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={product.name}>
            {product.variants.map((v) => (
              <button
                key={v.itemCode}
                type="button"
                role="radio"
                aria-checked={v.itemCode === variant.itemCode}
                onClick={() => pickVariant(v.itemCode)}
                className={clsx(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                  v.itemCode === variant.itemCode ? "border-brand bg-brand-50 text-brand-700" : "border-line text-ink-soft hover:border-ink/30",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        {product.variants.length === 1 && <p className="mt-1 text-sm text-ink-soft">{variant.label}</p>}

        <div className="mt-2 flex items-baseline gap-1.5">
          {variant.price != null ? (
            <>
              <span className="text-lg font-semibold text-ink">{money(variant.price, currency)}</span>
              {variant.uom && <span className="text-xs text-muted">{pfmt(labels.per, { uom: variant.uom.toLowerCase() })}</span>}
            </>
          ) : (
            <span className="text-sm font-medium text-gold">{labels.priceTbc}</span>
          )}
        </div>
        <p className="text-[0.7rem] text-muted">
          {variant.itemCode}
          {usualHere && <span className="ml-2 font-medium text-ink-soft">· {pfmt(labels.usually, { qty: usualHere.lastQty })}</span>}
        </p>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <div className="flex h-10 items-center rounded-full border border-line">
            <button type="button" aria-label="−" onClick={() => { setLocalQty((n) => Math.max(1, n - 1)); setSaved(false); }} className="grid size-10 place-items-center text-ink-soft">
              <Minus className="size-4" />
            </button>
            <input
              inputMode="numeric"
              value={qty}
              onChange={(e) => { setLocalQty(Math.max(1, Math.min(100000, Number(e.target.value.replace(/\D/g, "")) || 1))); setSaved(false); }}
              className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
              aria-label="Qty"
            />
            <button type="button" aria-label="+" onClick={() => { setLocalQty((n) => n + 1); setSaved(false); }} className="grid size-10 place-items-center text-ink-soft">
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => { setQty(variant.itemCode, qty); setSaved(true); }}
            className={clsx(
              "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition",
              saved && inCart === qty ? "bg-leaf text-white" : "bg-brand text-white hover:bg-brand-600",
            )}
          >
            {saved && inCart === qty ? <Check className="size-4" /> : null}
            {inCart > 0 ? labels.update : labels.add}
          </button>
        </div>
        {inCart > 0 && <p className="mt-1.5 text-xs font-medium text-leaf">{pfmt(labels.inCart, { n: inCart })}</p>}
      </div>
    </div>
  );
}
