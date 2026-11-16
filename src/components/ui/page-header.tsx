import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Inner-page header: faint grid backdrop, breadcrumbs, pill eyebrow, H1 and lead paragraph. */
export function PageHeader({
  crumbs,
  title,
  lead,
  eyebrow,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  lead?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-white">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="absolute -top-32 left-1/2 -z-10 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-brand/[0.04] blur-3xl" />
      <div className="container-x pb-7 pt-5 sm:pb-14 sm:pt-10">
        <Breadcrumbs items={crumbs} className="mb-5 sm:mb-8" />
        {eyebrow && <p className="eyebrow mb-3 sm:mb-4">{eyebrow}</p>}
        <h1 className="max-w-3xl animate-fade-up font-display text-[1.875rem] font-bold leading-[1.1] tracking-[-0.025em] text-ink sm:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[0.975rem] leading-relaxed text-ink-soft sm:mt-4 sm:text-lg">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
