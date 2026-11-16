import { Plus } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo";

/** Accessible accordion using native <details> (animated where supported). Optionally emits FAQPage JSON-LD. */
export function FaqList({ items, withSchema = true }: { items: { q: string; a: string }[]; withSchema?: boolean }) {
  if (!items.length) return null;
  return (
    <>
      <div className="space-y-2.5 sm:space-y-3">
        {items.map((f, i) => (
          <details
            key={i}
            className="smooth group rounded-2xl border border-line bg-white shadow-[var(--shadow-xs)] transition-colors open:border-ink/15 open:shadow-[var(--shadow-card)]"
            {...(i === 0 ? { open: true } : {})}
          >
            <summary className="flex list-none items-start justify-between gap-4 px-4 py-4 font-semibold text-ink sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
              <span className="leading-snug">{f.q}</span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line bg-white text-ink-soft transition duration-300 group-open:rotate-45 group-open:border-ink group-open:bg-ink group-open:text-white">
                <Plus className="size-4" aria-hidden />
              </span>
            </summary>
            <div className="px-4 pb-5 text-ink-soft sm:px-6">
              <p className="leading-relaxed">{f.a}</p>
            </div>
          </details>
        ))}
      </div>
      {withSchema && <JsonLd data={faqJsonLd(items)} />}
    </>
  );
}
