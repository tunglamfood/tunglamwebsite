"use client";

import { useState } from "react";
import clsx from "clsx";
import { Check, ChevronRight, MapPin, Search } from "lucide-react";
import { chooseDealer } from "@/lib/portal/actions";
import type { PortalCustomer } from "@/lib/portal/context";

export function DealerList({ customers, current, searchLabel }: { customers: PortalCustomer[]; current: string | null; searchLabel: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = customers.filter((c) => !needle || `${c.code} ${c.name} ${c.shortName} ${c.state}`.toLowerCase().includes(needle));

  return (
    <div className="space-y-4">
      {customers.length > 6 && (
        <label className="relative block sm:max-w-md">
          <span className="sr-only">{searchLabel}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchLabel}
            className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-4 text-[0.95rem] shadow-[var(--shadow-xs)] outline-none transition focus:border-ink/30 focus:ring-4 focus:ring-ink/5"
          />
        </label>
      )}
      <ul className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
        {shown.map((c) => {
          const on = c.code === current;
          const name = c.shortName || c.name;
          return (
            <li key={c.code}>
              <form action={chooseDealer}>
                <input type="hidden" name="code" value={c.code} />
                <button
                  className={clsx(
                    "glass group flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition duration-200 hover:bg-white/80",
                    on && "border-brand/40 ring-1 ring-brand/20",
                  )}
                >
                  <span className={clsx("grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold", on ? "bg-brand text-white" : "bg-sand text-ink-soft")}>
                    {name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-ink">{name}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-muted">
                      <span className="tabular-nums">{c.code}</span>
                      {c.state && (
                        <>
                          · <MapPin className="size-3 shrink-0" aria-hidden /> {c.state}
                        </>
                      )}
                    </span>
                  </span>
                  {on ? <Check className="size-5 shrink-0 text-brand" /> : <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
