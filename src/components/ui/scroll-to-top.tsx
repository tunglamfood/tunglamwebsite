"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Start every newly opened page at the very top. (Next.js only scrolls the new page's content into view,
 * which leaves the announcement bar / demo banner above the fold.) Back/forward keeps the browser's own
 * scroll restoration, and links to #anchors still jump to their section.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const first = useRef(true);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (popped.current) {
      popped.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
