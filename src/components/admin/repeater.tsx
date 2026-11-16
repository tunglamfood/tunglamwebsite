"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";

/** Ordered list of sub-items with add / remove / move controls. */
export function Repeater<T>({
  items,
  onChange,
  create,
  render,
  addLabel,
  itemLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  render: (item: T, update: (next: T) => void, index: number) => ReactNode;
  addLabel: string;
  itemLabel: (index: number) => string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const btn = "grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-white hover:text-ink disabled:opacity-30";
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-cream/60 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">{itemLabel(i)}</span>
            <div className="flex items-center gap-0.5">
              <button type="button" className={btn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp className="size-4" />
              </button>
              <button type="button" className={btn} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">
                <ArrowDown className="size-4" />
              </button>
              <button type="button" className={`${btn} hover:text-brand`} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
                <X className="size-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4">{render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))), i)}</div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, create()])}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 text-sm font-medium text-ink-soft transition-colors hover:border-zinc-400 hover:text-ink"
      >
        <Plus className="size-4" /> {addLabel}
      </button>
    </div>
  );
}
