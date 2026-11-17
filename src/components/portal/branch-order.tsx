"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Search, Send, X } from "lucide-react";
import { placeBranchOrders } from "@/lib/portal/actions";
import { pfmt, type PortalDict } from "@/lib/portal/i18n";
import { pbtn, pcard, pfield } from "./bits";
import { toast } from "./toast";

type Item = { itemCode: string; name: string; label: string; uom: string; image: string | null };

/**
 * A chain's head office ordering for many branches at once: products across the top,
 * branches down the side, one quantity per cell, then one order per branch.
 */
export function BranchOrder({
  labels, branches, items, last, defaultDate, minDate, maxDate,
}: {
  labels: PortalDict["branches"];
  branches: { code: string; name: string }[];
  items: Item[];
  last: Record<string, { itemCode: string; qty: number }[]>;
  defaultDate: string;
  minDate: string;
  maxDate: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cols, setCols] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, Record<string, number>>>({});
  const [po, setPo] = useState<Record<string, string>>({});
  const [deliverOn, setDeliverOn] = useState(defaultDate);
  const [note, setNote] = useState("");
  const [find, setFind] = useState("");
  const [branchFind, setBranchFind] = useState("");
  const itemOf = useMemo(() => new Map(items.map((i) => [i.itemCode, i])), [items]);

  const needle = find.trim().toLowerCase();
  const suggestions = needle
    ? items.filter((i) => !cols.includes(i.itemCode) && `${i.name} ${i.label} ${i.itemCode}`.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  const shownBranches = branches.filter((b) => !branchFind.trim() || `${b.name} ${b.code}`.toLowerCase().includes(branchFind.trim().toLowerCase()));
  const cell = (b: string, i: string) => qty[b]?.[i] ?? 0;
  const set = (b: string, i: string, n: number) => setQty((q) => ({ ...q, [b]: { ...(q[b] ?? {}), [i]: Math.max(0, Math.min(100000, Math.floor(n) || 0)) } }));
  const withQty = branches.filter((b) => cols.some((i) => cell(b.code, i) > 0));

  function repeatLast() {
    const nextCols = new Set(cols);
    const next: Record<string, Record<string, number>> = {};
    for (const b of branches) {
      for (const l of last[b.code] ?? []) {
        if (!itemOf.has(l.itemCode)) continue;
        nextCols.add(l.itemCode);
        (next[b.code] ??= {})[l.itemCode] = l.qty;
      }
    }
    setCols([...nextCols]);
    setQty(next);
  }

  function place() {
    const payload = withQty.map((b) => ({
      customerCode: b.code,
      theirRef: po[b.code] ?? "",
      lines: cols.map((i) => ({ itemCode: i, qty: cell(b.code, i) })).filter((l) => l.qty > 0),
    }));
    start(async () => {
      const res = await placeBranchOrders({ deliverOn, note, branches: payload });
      if (!res.ok) {
        if (res.reason === "signed_out") return router.push("/portal/login");
        return toast({ tone: "error", title: labels.failed.replace("{names}", "—") });
      }
      if (res.placed.length) toast({ title: pfmt(labels.placed, { n: res.placed.length }), body: res.placed.map((p) => p.orderNo).join(", ") });
      if (res.failed.length) {
        const nameOf = new Map(branches.map((b) => [b.code, b.name]));
        toast({ tone: "error", title: pfmt(labels.failed, { names: res.failed.map((f) => nameOf.get(f.customerCode) ?? f.customerCode).join(", ") }) });
      }
      // Keep only what failed, so it can be fixed and sent again.
      const failedCodes = new Set(res.failed.map((f) => f.customerCode));
      setQty((q) => Object.fromEntries(Object.entries(q).filter(([code]) => failedCodes.has(code))));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <section className={`${pcard} space-y-3 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{labels.deliverOn}</span>
            <input type="date" value={deliverOn} min={minDate} max={maxDate} onChange={(e) => setDeliverOn(e.target.value)} className={`${pfield} w-44`} />
          </label>
          <label className="block min-w-[14rem] flex-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">{labels.note}</span>
            <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className={pfield} />
          </label>
          <button type="button" onClick={repeatLast} className={pbtn("secondary")}><RotateCcw className="size-4" /> {labels.repeat}</button>
          {cols.length > 0 && <button type="button" onClick={() => { setCols([]); setQty({}); }} className={pbtn("secondary")}>{labels.clear}</button>}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.products}</span>
          <div className="flex flex-wrap items-center gap-2">
            {cols.map((i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line">
                <span className="font-medium text-ink">{itemOf.get(i)?.name}</span>
                <span className="text-muted">{itemOf.get(i)?.label}</span>
                <button type="button" aria-label={labels.remove} onClick={() => setCols(cols.filter((c) => c !== i))} className="text-muted hover:text-ink"><X className="size-3.5" /></button>
              </span>
            ))}
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input value={find} onChange={(e) => setFind(e.target.value)} placeholder={labels.search} className={`${pfield} pl-9`} />
              {suggestions.length > 0 && (
                <ul className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-line">
                  {suggestions.map((s) => (
                    <li key={s.itemCode}>
                      <button type="button" onClick={() => { setCols([...cols, s.itemCode]); setFind(""); }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream">
                        <span className="flex-1"><span className="font-medium text-ink">{s.name}</span> <span className="text-muted">{s.label}</span></span>
                        <span className="tabular-nums text-xs text-muted">{s.itemCode}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {cols.length === 0 ? (
        <p className={`${pcard} p-6 text-center text-sm text-muted`}>{labels.empty}</p>
      ) : (
        <section className={`${pcard} overflow-hidden`}>
          <div className="border-b border-line p-3">
            <input value={branchFind} onChange={(e) => setBranchFind(e.target.value)} placeholder={labels.filter} className={`${pfield} max-w-xs`} />
          </div>
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="sticky left-0 z-10 min-w-[11rem] border-b border-line bg-white px-3 py-2 text-left text-xs font-medium text-muted">{labels.branch}</th>
                  <th className="min-w-[7rem] border-b border-line px-2 py-2 text-left text-xs font-medium text-muted">{labels.po}</th>
                  {cols.map((i) => (
                    <th key={i} className="min-w-[6.5rem] border-b border-line px-2 py-2 text-right text-xs font-medium text-muted">
                      <span className="block text-ink">{itemOf.get(i)?.name}</span>
                      <span className="block">{itemOf.get(i)?.label} · {itemOf.get(i)?.uom.toLowerCase()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shownBranches.map((b) => (
                  <tr key={b.code} className={withQty.includes(b) ? "bg-brand-50/40" : ""}>
                    <td className="sticky left-0 border-b border-line bg-white/95 px-3 py-1.5">
                      <span className="block font-medium text-ink">{b.name}</span>
                      <span className="block text-xs tabular-nums text-muted">{b.code}</span>
                    </td>
                    <td className="border-b border-line px-2 py-1.5">
                      <input value={po[b.code] ?? ""} maxLength={60} onChange={(e) => setPo({ ...po, [b.code]: e.target.value })} className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm" />
                    </td>
                    {cols.map((i) => (
                      <td key={i} className="border-b border-line px-2 py-1.5 text-right">
                        <input inputMode="numeric" value={cell(b.code, i) || ""} placeholder="0"
                          onChange={(e) => set(b.code, i, Number(e.target.value.replace(/\D/g, "")))}
                          className="h-9 w-20 rounded-lg border border-line bg-white px-2 text-right text-base tabular-nums lg:text-sm" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-white">
                <tr>
                  <td className="sticky left-0 border-t border-line bg-white px-3 py-2 font-semibold text-ink">{labels.total}</td>
                  <td className="border-t border-line" />
                  {cols.map((i) => (
                    <td key={i} className="border-t border-line px-2 py-2 text-right font-semibold tabular-nums text-ink">
                      {branches.reduce((s, b) => s + cell(b.code, i), 0) || "—"}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end border-t border-line p-3">
            <button type="button" onClick={place} disabled={pending || withQty.length === 0} className={pbtn("primary", "lg")}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {pending ? labels.placing : pfmt(labels.place, { n: withQty.length })}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
