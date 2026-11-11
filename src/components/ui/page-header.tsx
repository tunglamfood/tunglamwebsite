import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Standard inner-page header: breadcrumbs, H1, lead paragraph. */
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
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-sand/70 to-cream">
      <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand/5 blur-3xl" aria-hidden />
      <div className="container-x py-12 sm:py-16">
        <Breadcrumbs items={crumbs} className="mb-6" />
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{lead}</p>}
        {children}
      </div>
    </section>
  );
}
