"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

/**
 * Small toast notifications for the portal. Call `toast(...)` from any client component;
 * <Toaster /> lives in the portal shell, so a toast survives the page change that often follows
 * (e.g. placing an order and landing on the order page).
 */
type Toast = { id: number; title: string; body?: string; tone: "success" | "error" };

let items: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(t: { title: string; body?: string; tone?: Toast["tone"] }) {
  const item: Toast = { id: ++seq, tone: "success", ...t };
  items = [...items.slice(-2), item];
  emit();
  setTimeout(() => dismiss(item.id), item.tone === "error" ? 6000 : 4000);
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const EMPTY: Toast[] = [];

function ToastCard({ t }: { t: Toast }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const Icon = t.tone === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div
      role={t.tone === "error" ? "alert" : "status"}
      className={clsx(
        "glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3 transition duration-300 ease-out",
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
      )}
    >
      <span className={clsx("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", t.tone === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug text-ink">{t.title}</p>
        {t.body && <p className="mt-0.5 text-xs leading-snug text-muted">{t.body}</p>}
      </div>
      <button type="button" onClick={() => dismiss(t.id)} aria-label="Close" className="-mr-1 grid size-7 shrink-0 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-4 lg:left-64 lg:top-5">
      {list.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
}
