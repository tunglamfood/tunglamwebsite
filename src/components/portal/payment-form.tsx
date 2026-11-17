"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImageUp, Loader2, Upload } from "lucide-react";
import { submitPayment, type PaymentState } from "@/lib/portal/payments";
import { pbtn, pcard, pfield } from "./bits";
import { toast } from "./toast";
import type { PortalDict } from "@/lib/portal/i18n";

/** Phone photos are often 4–8 MB: send a clear 2000-pixel JPEG instead (well under the 4 MB limit). */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 900_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", 0.85));
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PaymentForm({
  labels,
  orders,
  defaultOrder,
  today,
}: {
  labels: PortalDict["payments"];
  orders: string[];
  defaultOrder: string | null;
  today: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<PaymentState, FormData>(submitPayment, null);
  const [picked, setPicked] = useState<File | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [doneAt, setDoneAt] = useState<number | null>(null);

  // A new success: tell the dealer, clear the form, show the slip in the list.
  if (state?.ok && state.at !== doneAt) {
    setDoneAt(state.at);
    setPicked(null);
  }
  useEffect(() => {
    if (!doneAt) return;
    toast({ title: labels.sent });
    formRef.current?.reset();
    router.refresh();
  }, [doneAt, labels.sent, router]);

  const error = state && !state.ok ? labels.errors[state.error] : null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (picked) {
      setPreparing(true);
      fd.set("file", await shrink(picked));
      setPreparing(false);
    }
    startTransition(() => action(fd));
  }

  const busy = pending || preparing;
  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${pcard} space-y-4 p-4 sm:p-6`}>
      <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">{labels.upload}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.amount}</span>
          <input name="amount" inputMode="decimal" required placeholder="0.00" className={pfield} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.paidOn}</span>
          <input name="paid_on" type="date" required defaultValue={today} max={today} className={pfield} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.reference}</span>
          <input name="reference" maxLength={80} className={pfield} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">{labels.order}</span>
          <select name="order_no" defaultValue={defaultOrder ?? ""} className={pfield}>
            <option value="">{labels.orderNone}</option>
            {orders.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink">{labels.file}</span>
        <input
          ref={fileRef}
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-white/60 px-4 py-4 text-left transition hover:border-zinc-300 hover:bg-white"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
            {picked?.type === "application/pdf" ? <FileText className="size-5" /> : <ImageUp className="size-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{picked ? picked.name : labels.choose}</span>
            <span className="block text-xs text-muted">{picked ? `${(picked.size / 1024 / 1024).toFixed(1)} MB` : labels.fileHint}</span>
          </span>
          {picked && <span className="text-sm font-medium text-ink-soft">{labels.change}</span>}
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">{labels.note}</span>
        <textarea name="note" rows={2} maxLength={500} className={`${pfield} h-auto resize-y py-2.5`} />
      </label>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy || !picked} className={pbtn("primary", "lg", "w-full sm:w-auto")}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
