"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "./cart";
import { placeOrder } from "@/lib/portal/actions";
import { money, pfmt, type PortalDict } from "@/lib/portal/i18n";

export type CartItemInfo = { name: string; label: string; uom: string; price: number | null; image: string | null };

export function CartView({
  scope,
  items,
  currency,
  paymentTerms,
  onHold,
  labels,
  priceTbc,
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
      <div className="rounded-2xl border border-line bg-white p-10 text-center">
        <p className="text-ink-soft">{labels.empty}</p>
        <Link href="/portal/products" className="mt-4 inline-flex h-11 items-center rounded-full bg-brand px-6 font-semibold text-white">{labels.browse}</Link>
      </div>
    );
  }

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await placeOrder({ lines: available.map((l) => ({ itemCode: l.itemCode, qty: l.qty })), deliverOn, theirRef, note });
      if (!res.ok) {
        if (res.reason === "signed_out") return router.push("/portal/login");
        return setError((labels.errors as Record<string, string>)[res.reason] ?? labels.errors.generic);
      }
      clear();
      router.push(`/portal/orders/${encodeURIComponent(res.orderNo)}?placed=1`);
    });

  const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
        {lines.map((l) => {
          const it = items[l.itemCode];
          return (
            <li key={l.itemCode} className="flex gap-3 p-3 sm:p-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                {it?.image && <Image src={it.image} alt="" fill sizes="64px" className="object-contain p-1" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-ink">{it ? it.name : l.itemCode}</p>
                {it && <p className="text-sm text-ink-soft">{it.label} · <span className="text-muted">{l.itemCode}</span></p>}
                {!it && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                    <AlertTriangle className="size-3.5" /> {labels.unavailable}
                  </p>
                )}
                {it && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex h-9 items-center rounded-full border border-line">
                      <button type="button" aria-label="−" onClick={() => setQty(l.itemCode, l.qty - 1)} className="grid size-9 place-items-center text-ink-soft"><Minus className="size-4" /></button>
                      <input
                        inputMode="numeric"
                        value={l.qty}
                        onChange={(e) => setQty(l.itemCode, Number(e.target.value.replace(/\D/g, "")) || 1)}
                        className="w-12 bg-transparent text-center text-sm font-semibold outline-none"
                        aria-label="Qty"
                      />
                      <button type="button" aria-label="+" onClick={() => setQty(l.itemCode, l.qty + 1)} className="grid size-9 place-items-center text-ink-soft"><Plus className="size-4" /></button>
                    </div>
                    <p className="text-sm font-semibold text-ink">
                      {it.price != null ? money(it.price * l.qty, currency) : <span className="font-medium text-gold">{priceTbc}</span>}
                    </p>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setQty(l.itemCode, 0)} aria-label={labels.remove} className="self-start p-1 text-muted hover:text-brand">
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="space-y-4 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-ink-soft">{labels.subtotal}</span>
          <span className="font-display text-xl font-bold tracking-[-0.015em] text-ink sm:text-2xl">{money(total, currency)}</span>
        </div>
        {hasTbc && <p className="rounded-xl bg-gold-soft px-3 py-2 text-xs text-ink-soft">{labels.tbcNote}</p>}

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">{labels.deliverOn}</span>
          <input type="date" value={deliverOn} min={minDate} max={maxDate} onChange={(e) => setDeliverOn(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">{labels.poRef}</span>
          <input value={theirRef} maxLength={60} onChange={(e) => setTheirRef(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-ink">{labels.note}</span>
          <textarea value={note} maxLength={1000} rows={3} placeholder={labels.notePlaceholder} onChange={(e) => setNote(e.target.value)} className={`${field} resize-y`} />
        </label>
        {onHold && (
          <p className="flex gap-2 rounded-xl bg-gold-soft px-3 py-2 text-xs text-ink-soft">
            <AlertTriangle className="mt-px size-3.5 shrink-0 text-gold" aria-hidden /> {labels.onHold}
          </p>
        )}
        <p className="text-xs text-muted">{paymentTerms ? pfmt(labels.termsWith, { terms: paymentTerms }) : labels.terms}</p>
        {error && <p role="alert" className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={pending || available.length === 0}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? labels.placing : labels.place}
        </button>
        <button type="button" onClick={clear} className="w-full text-sm text-muted hover:text-brand">{labels.clear}</button>
      </div>
    </div>
  );
}
