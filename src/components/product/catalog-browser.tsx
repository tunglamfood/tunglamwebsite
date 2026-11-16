"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, SlidersHorizontal, X } from "lucide-react";
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

  const seriesCount = (v: string) => products.filter((p) => (!v || p.seriesSlug === v) && (!b || p.brandSlug === b)).length;
  const brandCount = (v: string) => products.filter((p) => (!v || p.brandSlug === v) && (!s || p.seriesSlug === s)).length;
  const groups = [
    { label: labels.series, value: s, set: setS, options: series, count: seriesCount },
    { label: labels.brand, value: b, set: setB, options: brands, count: brandCount },
  ];
  const filtering = !!(s || b || q);

  const searchBox = (
    <label className="relative block">
      <span className="sr-only">{labels.search}</span>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={labels.search}
        className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-[0.95rem] shadow-[var(--shadow-xs)] outline-none transition placeholder:text-muted/80 focus:border-ink/30 focus:ring-4 focus:ring-ink/5"
      />
    </label>
  );

  return (
    <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      {/* Desktop: sticky filter sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-6 rounded-2xl border border-line bg-white p-4 shadow-[var(--shadow-xs)]">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <SlidersHorizontal className="size-4" aria-hidden /> {labels.series} &amp; {labels.brand}
          </p>
          {groups.map((g) => (
            <div key={g.label} role="group" aria-label={g.label}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">{g.label}</p>
              <ul className="space-y-0.5">
                {[{ value: "", label: labels.all }, ...g.options].map((o) => {
                  const active = g.value === o.value;
                  return (
                    <li key={o.value || "all"}>
                      <button
                        type="button"
                        onClick={() => g.set(o.value)}
                        aria-pressed={active}
                        className={clsx(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                          active ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-sand hover:text-ink",
                        )}
                      >
                        <span className="truncate">{o.label}</span>
                        <span className={clsx("text-xs tabular-nums", active ? "text-white/70" : "text-muted")}>{g.count(o.value)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Phones/tablets: search + swipeable chips */}
        <div className="mb-5 space-y-3 lg:hidden">
          {searchBox}
          {groups.map((g) => (
            <div
              key={g.label}
              role="group"
              aria-label={g.label}
              className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
            >
              <span className="shrink-0 pr-1 text-xs font-semibold uppercase tracking-wider text-muted">{g.label}</span>
              {[{ value: "", label: labels.all }, ...g.options].map((o) => (
                <button
                  key={o.value || "all"}
                  type="button"
                  onClick={() => g.set(o.value)}
                  aria-pressed={g.value === o.value}
                  className={clsx(
                    "h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                    g.value === o.value ? "border-ink bg-ink text-white" : "border-line bg-white text-ink-soft active:bg-sand",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-4 lg:mb-5">
          <p className="text-sm text-muted" aria-live="polite">
            {labels.count.replace("{n}", String(filtered.length))}
          </p>
          <div className="flex items-center gap-3">
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setS("");
                  setB("");
                  setQ("");
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-ink-soft transition-colors hover:bg-sand hover:text-ink"
              >
                <X className="size-3.5" aria-hidden /> {labels.all}
              </button>
            )}
            <div className="hidden w-72 lg:block">{searchBox}</div>
          </div>
        </div>

        {filtered.length ? (
          <ProductGrid products={filtered} priorityCount={4} cols="md:grid-cols-3" />
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-white p-10 text-center text-muted">{labels.noResults}</p>
        )}
      </div>
    </div>
  );
}
