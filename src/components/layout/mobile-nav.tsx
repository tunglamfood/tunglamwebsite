"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { LOCALES, LOCALE_META, localePath, stripLocale, type Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import type { NavItem } from "./nav";

const subscribe = () => () => {};

export function MobileNav({
  items,
  locale,
  menuLabel,
  closeLabel,
  ctaLabel,
  whatsappLabel,
  languageLabel,
}: {
  items: NavItem[];
  locale: Locale;
  menuLabel: string;
  closeLabel: string;
  ctaLabel: string;
  whatsappLabel: string;
  languageLabel: string;
}) {
  const [open, setOpen] = useState(false);
  // Portal target only exists on the client.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const pathname = usePathname() ?? "/";
  const base = stripLocale(pathname);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  // Rendered in a portal: the sticky header uses backdrop-filter, which would otherwise
  // trap this fixed-position drawer inside the header's 72px box.
  const drawer = (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={menuLabel}>
      <button className="absolute inset-0 bg-ink/45" aria-label={closeLabel} onClick={close} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-cream shadow-2xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="font-display text-lg font-semibold">{menuLabel}</span>
          <button type="button" onClick={close} className="grid size-10 place-items-center rounded-full bg-white text-ink" aria-label={closeLabel}>
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Mobile">
          <ul>
            {items.map((item) => (
              <li key={item.href} className="border-b border-line/70 last:border-0">
                <Link href={item.href} onClick={close} className="flex items-center justify-between px-3 py-3.5 text-[1.05rem] font-semibold text-ink">
                  {item.label}
                  <ChevronRight className="size-4 text-muted" aria-hidden />
                </Link>
                {item.children && (
                  <ul className="mb-3 grid grid-cols-2 gap-2 px-3">
                    {item.children.slice(0, -1).map((c) => (
                      <li key={c.href}>
                        <Link href={c.href} onClick={close} className="block rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-ink-soft ring-1 ring-line">
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 px-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{languageLabel}</p>
            <div className="grid grid-cols-3 gap-2">
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  href={localePath(l, base)}
                  onClick={close}
                  hrefLang={LOCALE_META[l].hreflang}
                  aria-current={l === locale ? "true" : undefined}
                  className="rounded-xl bg-white py-2.5 text-center text-sm font-semibold text-ink-soft ring-1 ring-line aria-[current]:bg-ink aria-[current]:text-white aria-[current]:ring-ink"
                >
                  {LOCALE_META[l].short}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="grid shrink-0 gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link href={localePath(locale, "/wholesale")} onClick={close} className={buttonClass("primary", "md", "w-full")}>
            {ctaLabel}
          </Link>
          <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "md", "w-full")}>
            <WhatsAppIcon /> {whatsappLabel}
          </a>
        </div>
      </div>
    </div>
  );

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
      {open && mounted && createPortal(drawer, document.body)}
    </div>
  );
}
