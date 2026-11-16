"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, X } from "lucide-react";
import { useCart } from "./cart";
import { cancelOrder } from "@/lib/portal/actions";

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
        className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/90"
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
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-50 disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} {labels.cancel}
        </button>
      )}
      {error && <span className="self-center text-sm text-brand-700">{error}</span>}
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
      className="flex w-full items-center gap-4 rounded-2xl border border-line bg-white p-4 text-left transition hover:border-ink/30"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand text-ink"><RotateCcw className="size-5" /></span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
