import { Plus } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo";

/** Accessible accordion using native <details>. Optionally emits FAQPage JSON-LD. */
export function FaqList({ items, withSchema = true }: { items: { q: string; a: string }[]; withSchema?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
        {items.map((f, i) => (
          <details key={i} className="group" {...(i === 0 ? { open: true } : {})}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-ink transition hover:bg-cream sm:px-6 [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <Plus className="mt-0.5 size-5 shrink-0 text-brand transition group-open:rotate-45" aria-hidden />
            </summary>
            <div className="px-5 pb-5 text-ink-soft sm:px-6">
              <p className="leading-relaxed">{f.a}</p>
            </div>
          </details>
        ))}
      </div>
      {withSchema && <JsonLd data={faqJsonLd(items)} />}
    </>
  );
}
