"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Info, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "./cart";
import { placeOrder } from "@/lib/portal/actions";
import { toast } from "./toast";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";
import { pbtn, pcard, pfield } from "./bits";

export type CartItemInfo = { name: string; label: string; uom: string; price: number | null; image: string | null };

export function CartView({
  scope,
  items,
  currency,
  paymentTerms,
  onHold,
  labels,
  priceTbc,
  placedLabel,
  minDate,
  maxDate,
  defaultDate,
}: {
  scope: string;
  items: Record<string, CartItemInfo>;
  currency: string;
  paymentTerms: string;
  onHold: boolean;
  labels: PortalDict["cart"];
  priceTbc: string;
  /** "Thank you! Order {no} has been sent to Tung Lam." */
  placedLabel: string;
  minDate: string;
  maxDate: string;
  defaultDate: string;
}) {
  const { lines, setQty, clear } = useCart(scope);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deliverOn, setDeliverOn] = useState(defaultDate);
  const [theirRef, setTheirRef] = useState("");
  const [note, setNote] = useState("");

  const available = lines.filter((l) => items[l.itemCode]);
  const total = available.reduce((s, l) => s + (items[l.itemCode].price ?? 0) * l.qty, 0);
  const hasTbc = available.some((l) => items[l.itemCode].price == null);

  if (lines.length === 0) {
    return (
      <div className={`${pcard} flex flex-col items-center gap-4 px-6 py-14 text-center`}>
        <span className="grid size-14 place-items-center rounded-2xl bg-sand text-ink-soft">
          <ShoppingCart className="size-6" aria-hidden />
        </span>
        <p className="text-ink-soft">{labels.empty}</p>
        <Link href="/portal/products" className={pbtn("primary", "md")}>
          {labels.browse} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await placeOrder({ lines: available.map((l) => ({ itemCode: l.itemCode, qty: l.qty })), deliverOn, theirRef, note });
      if (!res.ok) {
        if (res.reason === "signed_out") return router.push("/portal/login");
        const msg = (labels.errors as Record<string, string>)[res.reason] ?? labels.errors.generic;
        toast({ tone: "error", title: msg });
        return setError(msg);
      }
      clear();
      toast({ title: pfmt(placedLabel, { no: res.orderNo }) });
      router.push(`/portal/orders/${encodeURIComponent(res.orderNo)}?placed=1`);
    });


  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <ul className={`${pcard} divide-y divide-line overflow-hidden`}>
        {lines.map((l) => {
          const it = items[l.itemCode];
          return (
            <li key={l.itemCode} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f4f3f1] sm:size-20">
                {it?.image && <Image src={it.image} alt="" fill sizes="80px" className="object-contain p-1.5 mix-blend-multiply" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-ink">{it ? it.name : l.itemCode}</p>
                {it && <p className="text-sm text-ink-soft">{it.label} · <span className="tabular-nums text-muted">{l.itemCode}</span></p>}
                {!it && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700">
                    <AlertTriangle className="size-3.5" /> {labels.unavailable}
                  </p>
                )}
                {it && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex h-9 items-center rounded-xl border border-line bg-white">
                      <button type="button" aria-label="−" onClick={() => setQty(l.itemCode, l.qty - 1)} className="grid size-9 place-items-center rounded-l-xl text-ink-soft transition-colors hover:bg-sand hover:text-ink"><Minus className="size-4" /></button>
                      <input
                        inputMode="numeric"
                        value={l.qty}
                        onChange={(e) => setQty(l.itemCode, Number(e.target.value.replace(/\D/g, "")) || 1)}
                        className="w-12 bg-transparent text-center text-sm font-semibold tabular-nums outline-none"
                        aria-label="Qty"
                      />
                      <button type="button" aria-label="+" onClick={() => setQty(l.itemCode, l.qty + 1)} className="grid size-9 place-items-center rounded-r-xl text-ink-soft transition-colors hover:bg-sand hover:text-ink"><Plus className="size-4" /></button>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {it.price != null ? money(it.price * l.qty, currency) : <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800">{priceTbc}</span>}
                    </p>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setQty(l.itemCode, 0)} aria-label={labels.remove} className="grid size-8 shrink-0 place-items-center self-start rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className={`${pcard} space-y-4 p-4 sm:p-5 lg:sticky lg:top-24`}>
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <span className="text-sm font-medium text-ink-soft">{labels.subtotal}</span>
          <span className="font-display text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">{money(total, currency)}</span>
        </div>
        {hasTbc && (
          <p className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden /> {labels.tbcNote}
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.deliverOn}</span>
          <input type="date" value={deliverOn} min={minDate} max={maxDate} onChange={(e) => setDeliverOn(e.target.value)} className={pfield} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.poRef}</span>
          <input value={theirRef} maxLength={60} onChange={(e) => setTheirRef(e.target.value)} className={pfield} />
          <span className="mt-1.5 block text-xs leading-relaxed text-muted">{labels.poHint}</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.note}</span>
          <textarea value={note} maxLength={1000} rows={3} placeholder={labels.notePlaceholder} onChange={(e) => setNote(e.target.value)} className={`${pfield} resize-y`} />
        </label>
        {onHold && (
          <p className="flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-amber-600" aria-hidden /> {labels.onHold}
          </p>
        )}
        <p className="text-xs text-muted">{paymentTerms ? pfmt(labels.termsWith, { terms: paymentTerms }) : labels.terms}</p>
        {error && <p role="alert" className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={pending || available.length === 0}
          className={pbtn("primary", "lg", "w-full")}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? labels.placing : labels.place}
        </button>
        <button type="button" onClick={clear} className="w-full rounded-lg py-1.5 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600">{labels.clear}</button>
      </div>
    </div>
  );
}
