"use client";

import { useEffect, useRef } from "react";

/** Counts from a start value up to `value` when scrolled into view. Server-renders the final number (SEO / no-JS). */
export function CountUp({ value, from, suffix = "", duration = 1400 }: { value: number; from?: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = from ?? 0;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = `${Math.round(start + (value - start) * eased)}${suffix}`;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, from, suffix, duration]);
  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}
