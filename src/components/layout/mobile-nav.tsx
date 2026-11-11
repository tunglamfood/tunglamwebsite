"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";
import { buttonClass } from "@/components/ui/button";
import type { NavItem } from "./nav";

export function MobileNav({
  items,
  locale,
  menuLabel,
  closeLabel,
  ctaLabel,
}: {
  items: NavItem[];
  locale: Locale;
  menuLabel: string;
  closeLabel: string;
  ctaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-10 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink"
        aria-label={menuLabel}
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label={closeLabel} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] animate-fade-up flex-col bg-cream shadow-2xl">
            <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-5">
              <span className="font-display text-lg font-semibold">{menuLabel}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-10 place-items-center rounded-full bg-white text-ink"
                aria-label={closeLabel}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto px-3 py-4"
              aria-label="Mobile"
              onClick={(e) => {
                // Close when any link inside is followed.
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block rounded-xl px-3 py-3 text-lg font-semibold text-ink hover:bg-sand">
                      {item.label}
                    </Link>
                    {item.children && (
                      <ul className="mb-2 ml-3 border-l border-line pl-3">
                        {item.children.map((c) => (
                          <li key={c.href + c.label}>
                            <Link href={c.href} className="block rounded-lg px-3 py-2 text-ink-soft hover:bg-sand">
                              {c.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-line p-5">
              <Link href={localePath(locale, "/wholesale")} onClick={() => setOpen(false)} className={buttonClass("primary", "md", "w-full")}>
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
