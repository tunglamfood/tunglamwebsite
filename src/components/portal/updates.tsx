"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Which orders the dealer has looked at since Tung Lam last changed them, kept on this
 * device per login + dealer (like the cart). An order the office confirmed, changed or
 * delivered shows "Updated" — and counts on the Orders tab — until its page is opened.
 */
type Seen = Record<string, string>;

const key = (scope: string) => `tl_seen_orders:${scope}`;
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: Seen }>();
const EMPTY: Seen = {};

function snapshot(scope: string): Seen {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key(scope));
  } catch {
    return EMPTY;
  }
  const hit = cache.get(scope);
  if (hit && hit.raw === raw) return hit.value;
  let value: Seen = {};
  try {
    value = raw ? (JSON.parse(raw) as Seen) : {};
  } catch {
    value = {};
  }
  cache.set(scope, { raw, value });
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function useSeen(scope: string): Seen {
  return useSyncExternalStore(subscribe, () => snapshot(scope), () => EMPTY);
}

export const isNew = (seen: Seen, orderNo: string, at: string) => !seen[orderNo] || seen[orderNo] < at;

/** Remembers that this order's latest update has been seen. Renders nothing. */
export function MarkSeen({ scope, orderNo, at }: { scope: string; orderNo: string; at: string | null }) {
  useEffect(() => {
    if (!at) return;
    const current = snapshot(scope);
    if (current[orderNo] && current[orderNo] >= at) return;
    const next = Object.fromEntries(
      Object.entries({ ...current, [orderNo]: at }).sort((a, b) => (a[1] < b[1] ? 1 : -1)).slice(0, 200),
    );
    try {
      localStorage.setItem(key(scope), JSON.stringify(next));
    } catch {
      return;
    }
    listeners.forEach((l) => l());
  }, [scope, orderNo, at]);
  return null;
}

/** A small "Updated" mark beside an order the dealer has not opened since it changed. */
export function UpdatedMark({ scope, orderNo, at, label }: { scope: string; orderNo: string; at: string | undefined; label: string }) {
  const seen = useSeen(scope);
  if (!at || !isNew(seen, orderNo, at)) return null;
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full bg-brand px-1.5 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

/** How many orders changed since the dealer last looked — the number on the Orders tab. */
export function useUnseenUpdates(scope: string, updates: { orderNo: string; at: string }[]) {
  const seen = useSeen(scope);
  return updates.filter((u) => isNew(seen, u.orderNo, u.at)).length;
}
