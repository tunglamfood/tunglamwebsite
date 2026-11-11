import Image from "next/image";
import clsx from "clsx";
import type { CSSProperties } from "react";

/** Food cut-outs (transparent WebP) in /public/images/cut. */
export type Cutout = "tofu-puffs" | "fish-balls" | "egg-tofu" | "cendol" | "cincau" | "hotpot" | "chili";

/** A decorative, gently floating food cut-out. Purely ornamental (aria-hidden). */
export function Floaty({
  name,
  className,
  size = 160,
  rotate = 0,
  slow,
  delay = 0,
  priority,
}: {
  name: Cutout;
  className?: string;
  size?: number;
  rotate?: number;
  slow?: boolean;
  delay?: number;
  priority?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={clsx("pointer-events-none absolute select-none drop-shadow-[0_14px_18px_rgb(31_27_23/0.18)]", slow ? "animate-float-slow" : "animate-float", className)}
      style={{ "--r": `${rotate}deg`, animationDelay: `${delay}s`, width: size } as CSSProperties}
    >
      <Image src={`/images/cut/${name}.webp`} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} priority={priority} className="h-auto w-full" />
    </span>
  );
}

/** Quiet scrolling ticker. Content is duplicated for a seamless loop; the copy is hidden from assistive tech. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <li key={i} className="flex items-center whitespace-nowrap px-5 text-sm font-medium uppercase tracking-[0.14em] sm:px-7">
          {it}
          <span className="ml-10 size-1.5 rounded-full bg-brand sm:ml-14" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={clsx("overflow-hidden", className)}>
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
