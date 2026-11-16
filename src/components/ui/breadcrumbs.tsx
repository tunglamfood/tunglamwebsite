import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export type Crumb = { name: string; href: string };

/** Visible breadcrumb trail + BreadcrumbList JSON-LD. Hrefs must be locale-prefixed. */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-muted sm:text-sm">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.href} className="inline-flex min-w-0 items-center gap-1">
                {last ? (
                  <span aria-current="page" className="truncate font-medium text-ink">
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-ink">
                      {i === 0 && <Home className="size-3.5" aria-hidden />}
                      <span className={i === 0 ? "sr-only sm:not-sr-only" : undefined}>{c.name}</span>
                    </Link>
                    <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items.map((c) => ({ name: c.name, url: c.href })))} />
    </>
  );
}
