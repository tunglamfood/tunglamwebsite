"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, RotateCcw, X } from "lucide-react";
import { useCart } from "./cart";
import { cancelOrder } from "@/lib/portal/actions";
import { pbtn } from "./bits";

/** "Order again" puts the order's items back in the cart; "Cancel" works until the office confirms. */
export function OrderActions({
  scope,
  orderNo,
  canCancel,
  lines,
  labels,
}: {
  scope: string;
  orderNo: string;
  canCancel: boolean;
  lines: { itemCode: string; qty: number }[];
  labels: { reorder: string; cancel: string; cancelConfirm: string };
}) {
  const { addMany } = useCart(scope);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => { addMany(lines); router.push("/portal/cart"); }}
        className={pbtn("primary")}
      >
        <RotateCcw className="size-4" /> {labels.reorder}
      </button>
      {canCancel && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(labels.cancelConfirm)) return;
            start(async () => {
              const res = await cancelOrder(orderNo);
              if (!res.ok) setError(res.reason ?? "error");
              router.refresh();
            });
          }}
          className={pbtn("danger")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} {labels.cancel}
        </button>
      )}
      {error && <span className="self-center text-sm text-red-700">{error}</span>}
    </div>
  );
}

export function ReorderButton({ scope, lines, title, text }: { scope: string; lines: { itemCode: string; qty: number }[]; title: string; text: string }) {
  const { addMany } = useCart(scope);
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => { addMany(lines); router.push("/portal/cart"); }}
      className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left shadow-[var(--shadow-xs)] transition duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-[var(--shadow-lift)] sm:p-5"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600"><RotateCcw className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block truncate text-sm text-muted">{text}</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 text-muted transition duration-300 group-hover:rotate-45 group-hover:text-ink" aria-hidden />
    </button>
  );
}
