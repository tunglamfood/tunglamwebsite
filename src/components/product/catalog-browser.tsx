"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search } from "lucide-react";
import { ProductGrid, type ProductCardData } from "./product-card";

type Option = { value: string; label: string };

export function CatalogBrowser({
  products,
  series,
  brands,
  labels,
}: {
  products: ProductCardData[];
  series: Option[];
  brands: Option[];
  labels: { all: string; series: string; brand: string; search: string; noResults: string; count: string };
}) {
  const [s, setS] = useState("");
  const [b, setB] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!s || p.seriesSlug === s) &&
        (!b || p.brandSlug === b) &&
        (!needle || `${p.name} ${p.short} ${p.brand ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [products, s, b, q]);

  const chip = (active: boolean) =>
    clsx(
      "h-9 rounded-full px-4 text-sm font-medium transition",
      active ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink/30",
    );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-white/70 p-4 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={labels.series}>
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">{labels.series}</span>
            <button type="button" className={chip(!s)} onClick={() => setS("")} aria-pressed={!s}>
              {labels.all}
            </button>
            {series.map((o) => (
              <button key={o.value} type="button" className={chip(s === o.value)} onClick={() => setS(o.value)} aria-pressed={s === o.value}>
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={labels.brand}>
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-muted">{labels.brand}</span>
            <button type="button" className={chip(!b)} onClick={() => setB("")} aria-pressed={!b}>
              {labels.all}
            </button>
            {brands.map((o) => (
              <button key={o.value} type="button" className={chip(b === o.value)} onClick={() => setB(o.value)} aria-pressed={b === o.value}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <label className="relative block lg:w-72">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.search}
            className="h-10 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
        </label>
      </div>

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {labels.count.replace("{n}", String(filtered.length))}
      </p>
      {filtered.length ? (
        <ProductGrid products={filtered} priorityCount={4} />
      ) : (
        <p className="rounded-[var(--radius-card)] bg-white p-10 text-center text-muted">{labels.noResults}</p>
      )}
    </div>
  );
}
