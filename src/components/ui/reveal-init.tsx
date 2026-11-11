"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Activates scroll-reveal for every element with class "reveal" (server-rendered).
 * Elements animate in once when they enter the viewport. Without JS they stay visible
 * (the hidden state only applies under html.js, set by an inline script in the layout).
 */
export function RevealInit() {
  const pathname = usePathname();
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
