"use client";

import { useState } from "react";
import clsx from "clsx";

export type Week = { label: string; recipes: number; guides: number };

/**
 * Posts published per week (single series: recipes + guides).
 * Bars carry their own hover/focus tooltip with the breakdown; a visually hidden table mirrors the data.
 */
export function PublishChart({ weeks }: { weeks: Week[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = weeks.map((w) => w.recipes + w.guides);
  const peak = Math.max(...totals, 1);
  // Round the axis up to a tidy step (1, 2, 5, 10…) with ~4 gridlines.
  const step = [1, 2, 5, 10, 20, 50].find((s) => s * 4 >= peak) ?? Math.ceil(peak / 4);
  const top = step * Math.max(1, Math.ceil(peak / step));
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step).reverse();

  return (
    <div className="viz-root" style={{ "--series-1": "#2a78d6" } as React.CSSProperties}>
      <div className="relative flex gap-3">
        {/* Y axis */}
        <div className="relative h-48 w-5 text-right text-[0.7rem] tabular-nums text-muted sm:h-56" aria-hidden>
          {ticks.map((t, i) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 leading-none" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 sm:h-56" aria-hidden>
            {ticks.map((t, i) => (
              <span
                key={t}
                className={clsx("absolute inset-x-0 h-px", i === ticks.length - 1 ? "bg-zinc-200" : "bg-zinc-100")}
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          {/* Bars */}
          <div className="relative flex h-48 items-end gap-[2px] sm:h-56" onPointerLeave={() => setActive(null)}>
            {weeks.map((w, i) => {
              const total = totals[i];
              const pct = (total / top) * 100;
              return (
                <button
                  key={w.label}
                  type="button"
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`Week of ${w.label}: ${total} posts (${w.recipes} recipes, ${w.guides} guides)`}
                >
                  <span className={clsx("absolute inset-x-0 inset-y-0 rounded-md transition-colors", active === i && "bg-zinc-100/70")} />
                  <span
                    className={clsx("relative w-full max-w-6 rounded-t-[4px] transition-[height,filter] duration-500 ease-out", active === i && "brightness-110")}
                    style={{ height: total ? `${pct}%` : 0, background: "var(--series-1)" }}
                  />
                  {active === i && (
                    <span
                      role="tooltip"
                      className={clsx(
                        "pointer-events-none absolute bottom-full z-10 mb-2 w-40 rounded-xl bg-white p-3 text-left shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_12px_28px_-8px_rgb(0_0_0/0.22)]",
                        i < 2 ? "left-0" : i > weeks.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                      style={{ bottom: `${Math.min(pct, 70)}%` }}
                    >
                      <span className="block text-xs text-muted">Week of {w.label}</span>
                      <span className="mt-1 flex items-center gap-2 text-sm">
                        <span className="h-0.5 w-3 rounded-full" style={{ background: "var(--series-1)" }} />
                        <strong className="font-semibold text-ink tabular-nums">{total}</strong>
                        <span className="text-muted">{total === 1 ? "post" : "posts"}</span>
                      </span>
                      <span className="mt-1 block text-xs text-muted tabular-nums">
                        {w.recipes} recipes · {w.guides} guides
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* X axis */}
          <div className="mt-2 flex gap-[2px] text-[0.7rem] text-muted">
            {weeks.map((w, i) => (
              <span key={w.label} className={clsx("flex-1 truncate text-center", i % 2 === 1 && "max-sm:invisible")}>
                {w.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <table className="sr-only">
        <caption>Posts published per week</caption>
        <thead>
          <tr>
            <th>Week of</th>
            <th>Recipes</th>
            <th>Guides</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((w, i) => (
            <tr key={w.label}>
              <td>{w.label}</td>
              <td>{w.recipes}</td>
              <td>{w.guides}</td>
              <td>{totals[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
