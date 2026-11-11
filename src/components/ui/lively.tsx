import Image from "next/image";
import clsx from "clsx";
import type { CSSProperties } from "react";

/** Food cut-outs (transparent WebP) in /public/images/cut. */
export type Cutout = "tofu-puffs" | "fish-balls" | "egg-tofu" | "cendol" | "cincau" | "hotpot" | "chili";

/** A decorative floating food cut-out. Purely ornamental (aria-hidden). */
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
      className={clsx("pointer-events-none absolute select-none drop-shadow-[0_14px_18px_rgb(31_27_23/0.22)]", slow ? "animate-float-slow" : "animate-float", className)}
      style={{ "--r": `${rotate}deg`, animationDelay: `${delay}s`, width: size } as CSSProperties}
    >
      <Image src={`/images/cut/${name}.webp`} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} priority={priority} className="h-auto w-full" />
    </span>
  );
}

/** Infinite scrolling ticker. Content is duplicated for a seamless loop; the copy is hidden from assistive tech. */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <li key={i} className="flex items-center whitespace-nowrap px-5 font-display text-lg font-semibold sm:px-7 sm:text-2xl">
          {it}
          <svg viewBox="0 0 24 24" className="ml-10 size-4 fill-sun sm:ml-14 sm:size-5" aria-hidden>
            <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
          </svg>
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

/** Slowly rotating circular text badge with the TL logo in the middle. */
export function SpinBadge({ text, className }: { text: string; className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="relative grid size-full place-items-center rounded-full border-2 border-ink bg-white shadow-[4px_4px_0_var(--color-ink)]">
      <svg viewBox="0 0 120 120" className="absolute inset-0 animate-spin-slow">
        <defs>
          <path id="spin-badge-circle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <text className="fill-ink font-display" fontSize="10" fontWeight="700" letterSpacing="1.5">
          <textPath href="#spin-badge-circle">{text}</textPath>
        </text>
      </svg>
        <Image src="/brand/logo.webp" alt="" width={299} height={171} className="w-[46%]" />
      </div>
    </div>
  );
}

/** Wavy section divider. Set text colour to the colour of the section below. */
export function Wave({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className={clsx("block h-8 w-full sm:h-12", flip && "rotate-180", className)}>
      <path fill="currentColor" d="M0 30c120-30 240-30 360 0s240 30 360 0 240-30 360 0 240 30 360 0v30H0z" />
    </svg>
  );
}
