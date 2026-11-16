"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The basket lives in the browser (localStorage), one per login + dealer, so a
 * rep switching between dealers never mixes their baskets. Only item codes and
 * quantities are kept: prices are always taken fresh from the ERP, and the
 * order total is recalculated by the database when the order is placed.
 */
export type CartLine = { itemCode: string; qty: number };

const EMPTY: CartLine[] = [];
const cache = new Map<string, CartLine[]>();
const listeners = new Set<() => void>();
const keyOf = (scope: string) => `tl-cart:${scope}`;

function read(scope: string): CartLine[] {
  if (cache.has(scope)) return cache.get(scope)!;
  let lines: CartLine[] = EMPTY;
  try {
    const raw = localStorage.getItem(keyOf(scope));
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    lines = Array.isArray(parsed)
      ? parsed.filter((l) => l && typeof l.itemCode === "string" && Number(l.qty) > 0).map((l) => ({ itemCode: l.itemCode, qty: Math.floor(Number(l.qty)) }))
      : EMPTY;
  } catch {
    lines = EMPTY;
  }
  cache.set(scope, lines);
  return lines;
}

function write(scope: string, lines: CartLine[]) {
  cache.set(scope, lines);
  try {
    if (lines.length) localStorage.setItem(keyOf(scope), JSON.stringify(lines));
    else localStorage.removeItem(keyOf(scope));
  } catch {
    /* private mode / storage full: the cart still works for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("tl-cart:")) {
      cache.delete(e.key.slice("tl-cart:".length));
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(scope: string) {
  const lines = useSyncExternalStore(subscribe, () => read(scope), () => EMPTY);

  const setQty = useCallback(
    (itemCode: string, qty: number) => {
      const q = Math.max(0, Math.min(100000, Math.floor(qty) || 0));
      const current = read(scope);
      const next = current.some((l) => l.itemCode === itemCode)
        ? current.map((l) => (l.itemCode === itemCode ? { ...l, qty: q } : l)).filter((l) => l.qty > 0)
        : q > 0 ? [...current, { itemCode, qty: q }] : current;
      write(scope, next);
    },
    [scope],
  );

  const addMany = useCallback(
    (add: CartLine[]) => {
      const next = [...read(scope)];
      for (const a of add) {
        const i = next.findIndex((l) => l.itemCode === a.itemCode);
        if (i >= 0) next[i] = { ...next[i], qty: next[i].qty + a.qty };
        else next.push({ itemCode: a.itemCode, qty: a.qty });
      }
      write(scope, next.filter((l) => l.qty > 0));
    },
    [scope],
  );

  const clear = useCallback(() => write(scope, []), [scope]);
  const qtyOf = useCallback((itemCode: string) => lines.find((l) => l.itemCode === itemCode)?.qty ?? 0, [lines]);

  return { lines, setQty, addMany, clear, qtyOf, count: lines.length };
}
