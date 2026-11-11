import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Clean inner-page header: soft tinted band, breadcrumbs, H1 and lead paragraph. */
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
    <section className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-sand/60 to-cream">
      <div aria-hidden className="absolute -right-32 -top-40 -z-10 size-96 rounded-full bg-sand/50 blur-3xl" />
      <div className="container-x pb-8 pt-7 sm:pb-14 sm:pt-12">
        <Breadcrumbs items={crumbs} className="mb-4 sm:mb-6" />
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-3xl animate-fade-up font-display text-[2rem] font-semibold leading-tight tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft sm:mt-4 sm:text-lg">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
