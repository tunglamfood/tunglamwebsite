"use client";

import { useState } from "react";
import { Check, ChevronRight, Search } from "lucide-react";
import { chooseDealer } from "@/lib/portal/actions";
import type { PortalCustomer } from "@/lib/portal/context";

export function DealerList({ customers, current, searchLabel }: { customers: PortalCustomer[]; current: string | null; searchLabel: string }) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const shown = customers.filter((c) => !needle || `${c.code} ${c.name} ${c.shortName} ${c.state}`.toLowerCase().includes(needle));

  return (
    <div className="space-y-3">
      {customers.length > 6 && (
        <label className="relative block">
          <span className="sr-only">{searchLabel}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={searchLabel}
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </label>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {shown.map((c) => (
          <li key={c.code}>
            <form action={chooseDealer}>
              <input type="hidden" name="code" value={c.code} />
              <button className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-cream">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{c.shortName || c.name}</p>
                  <p className="text-sm text-muted">{c.code}{c.state ? ` · ${c.state}` : ""}{c.shortName && c.shortName !== c.name ? ` · ${c.name}` : ""}</p>
                </div>
                {c.code === current ? <Check className="size-5 text-leaf" /> : <ChevronRight className="size-4 text-muted" />}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
