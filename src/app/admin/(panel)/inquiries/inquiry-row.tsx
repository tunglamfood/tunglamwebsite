"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ChevronDown, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { deleteInquiry, setInquiryStatus } from "@/lib/admin/actions";
import type { Inquiry } from "@/lib/admin/queries";
import { inputClass } from "@/components/admin/fields";

const KIND: Record<Inquiry["kind"], string> = { general: "General", wholesale: "Wholesale", product: "Product", career: "Career" };

export function InquiryRow({ inquiry: q, defaultOpen }: { inquiry: Inquiry; defaultOpen?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const phoneDigits = q.phone?.replace(/[^\d]/g, "").replace(/^0/, "60");

  const setStatus = (s: Inquiry["status"]) =>
    start(async () => {
      await setInquiryStatus(q.id, s);
      router.refresh();
    });
  const remove = () => {
    if (!confirm("Delete this enquiry?")) return;
    start(async () => {
      await deleteInquiry(q.id);
      router.refresh();
    });
  };

  return (
    <li className={clsx(pending && "opacity-60")}>
      <details open={defaultOpen} className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-cream [&::-webkit-details-marker]:hidden">
          {q.status === "new" && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="New" />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {q.name}
              {q.company && <span className="font-normal text-muted"> · {q.company}</span>}
            </p>
            <p className="truncate text-sm text-muted">{q.message || q.product_slug || "—"}</p>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="text-xs font-medium text-ink-soft">{KIND[q.kind]}</p>
            <p className="text-xs text-muted">{new Date(q.created_at).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <ChevronDown className="size-4 shrink-0 text-muted transition group-open:rotate-180" />
        </summary>

        <div className="space-y-4 border-t border-line bg-cream/50 px-4 py-4">
          {q.message && <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{q.message}</p>}
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ["Type", KIND[q.kind]],
              ["Product", q.product_slug],
              ["Language", q.locale?.toUpperCase()],
              ["Page", q.page_url],
              ["Received", new Date(q.created_at).toLocaleString("en-MY")],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-20 shrink-0 text-muted">{k}</dt>
                  <dd className="min-w-0 break-words text-ink">{v}</dd>
                </div>
              ))}
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            {q.phone && (
              <>
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#25d366] px-3 text-sm font-medium text-white">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
                <a href={`tel:${q.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm text-ink-soft">
                  <Phone className="size-4" /> {q.phone}
                </a>
              </>
            )}
            {q.email && (
              <a href={`mailto:${q.email}`} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-white px-3 text-sm text-ink-soft">
                <Mail className="size-4" /> {q.email}
              </a>
            )}
            <div className="ml-auto flex items-center gap-2">
              <select
                value={q.status}
                onChange={(e) => setStatus(e.target.value as Inquiry["status"])}
                className={clsx(inputClass, "h-8 w-auto py-0 text-sm")}
                aria-label="Status"
              >
                <option value="new">New</option>
                <option value="in_progress">In progress</option>
                <option value="closed">Closed</option>
                <option value="spam">Spam</option>
              </select>
              <button type="button" onClick={remove} className="grid size-8 place-items-center rounded-md border border-line bg-white text-brand" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </details>
    </li>
  );
}
