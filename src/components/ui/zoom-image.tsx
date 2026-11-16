"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

/** Wraps a thumbnail: click/tap opens the photo large in a frosted overlay (Esc or tap outside closes). */
export function ZoomImage({ src, alt, children, className = "" }: { src: string; alt: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={`${alt} — enlarge`} className={`group/zoom relative block w-full cursor-zoom-in ${className}`}>
        {children}
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-white/80 text-ink-soft opacity-0 backdrop-blur transition group-hover/zoom:opacity-100 max-lg:opacity-100">
          <ZoomIn className="size-3.5" aria-hidden />
        </span>
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] grid animate-fade-in place-items-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={alt}>
            <button className="absolute inset-0 cursor-zoom-out bg-ink/45 backdrop-blur-md" aria-label="Close" onClick={() => setOpen(false)} />
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-2xl backdrop-blur-xl">
              <div className="relative aspect-square w-full">
                <Image src={src} alt={alt} fill sizes="(min-width: 768px) 672px, 92vw" className="object-contain p-6 sm:p-10" />
              </div>
              <p className="border-t border-line/70 px-5 py-3 text-center text-sm font-semibold text-ink">{alt}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white">
                <X className="size-4" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
