import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { Floaty, Wave, type Cutout } from "./lively";

/** Lively inner-page header: sunny band, dotted pattern, floating food cut-outs, wavy bottom edge. */
export function PageHeader({
  crumbs,
  title,
  lead,
  eyebrow,
  cut = "tofu-puffs",
  cut2 = "chili",
  children,
}: {
  crumbs: Crumb[];
  title: string;
  lead?: string;
  eyebrow?: string;
  /** Main decorative cut-out (right side). */
  cut?: Cutout;
  /** Small secondary cut-out. */
  cut2?: Cutout;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-sun-soft">
      <div aria-hidden className="dots absolute inset-0 -z-10 text-ink/[0.06]" />
      <div aria-hidden className="absolute -right-20 -top-24 -z-10 size-80 rounded-full bg-sun/60 blur-2xl" />
      <Floaty name={cut} className="right-[4%] top-[14%] hidden w-36 md:block lg:w-44" size={176} rotate={-8} slow priority />
      <Floaty name={cut2} className="right-[22%] top-[58%] hidden w-16 lg:block" size={72} rotate={24} delay={1.5} />
      <Floaty name={cut} className="-right-6 top-3 w-20 opacity-90 md:hidden" size={80} rotate={-10} slow priority />
      <div className="container-x relative pb-8 pt-7 sm:pb-12 sm:pt-12">
        <Breadcrumbs items={crumbs} className="mb-4 sm:mb-6" />
        {eyebrow && <p className="sticker mb-4 -rotate-1">{eyebrow}</p>}
        <h1 className="max-w-[80%] animate-fade-up font-display text-[2.1rem] font-bold leading-tight tracking-tight text-ink sm:text-6xl md:max-w-3xl">
          <span className="marker">{title}</span>
        </h1>
        {lead && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:mt-5 sm:text-lg md:max-w-xl lg:max-w-2xl">{lead}</p>}
        {children}
      </div>
      <Wave className="-mb-px text-cream" />
    </section>
  );
}
