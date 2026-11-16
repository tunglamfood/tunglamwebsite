"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
import { LOCALES, LOCALE_META, localePath, stripLocale, type Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { isActive, type NavItem } from "./nav";

const subscribe = () => () => {};

/** Phone/tablet menu: a full-height sheet that slides in from the right. */
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
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  // Portal target only exists on the client.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const pathname = usePathname() ?? "/";
  const base = stripLocale(pathname);
  const open = phase !== "closed";

  const close = () => {
    setPhase("closing");
    setTimeout(() => setPhase("closed"), 220);
  };

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPhase("closing");
      setTimeout(() => setPhase("closed"), 220);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const row = (href: string, label: string) => (
    <Link
      href={href}
      onClick={close}
      aria-current={isActive(pathname, href) ? "page" : undefined}
      className="flex items-center justify-between rounded-xl px-3 py-3 text-[1.0625rem] font-semibold text-ink transition-colors active:bg-sand aria-[current]:bg-sand"
    >
      {label}
      <ChevronRight className="size-4 text-muted" aria-hidden />
    </Link>
  );

  // Rendered in a portal: the sticky header uses backdrop-filter, which would otherwise
  // trap this fixed-position sheet inside the header's box.
  const sheet = (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label={menuLabel}>
      <button
        className={clsx("absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-200", phase === "closing" ? "opacity-0" : "animate-fade-in")}
        aria-label={closeLabel}
        onClick={close}
      />
      <div
        className={clsx(
          "absolute inset-y-0 right-0 flex w-full max-w-[24rem] flex-col bg-white shadow-2xl transition-transform duration-200 ease-in",
          phase === "closing" ? "translate-x-full" : "animate-drawer-in",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-9 w-auto" />
          <button type="button" onClick={close} className="grid size-10 place-items-center rounded-xl border border-line text-ink transition-colors active:bg-sand" aria-label={closeLabel}>
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile">
          {items.map((item) =>
            item.menu === "mega" && item.children ? (
              <div key={item.href} className="mb-3">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted">{item.label}</p>
                <ul className="space-y-1.5">
                  {item.children.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={close}
                        aria-current={isActive(pathname, c.href) ? "page" : undefined}
                        className="flex items-center gap-3 rounded-xl border border-line p-2 transition-colors active:bg-sand aria-[current]:border-ink/20 aria-[current]:bg-sand"
                      >
                        {c.image && (
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                            <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-ink">{c.label}</span>
                          {c.description && <span className="block truncate text-xs text-muted">{c.description}</span>}
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
                {item.all && (
                  <Link href={item.all.href} onClick={close} className="mt-2 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
                    {item.all.label}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            ) : item.children ? (
              item.children.map((c) => <div key={c.href}>{row(c.href, c.label)}</div>)
            ) : (
              <div key={item.href}>{row(item.href, item.label)}</div>
            ),
          )}

          <div className="mt-5 px-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{languageLabel}</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-sand p-1">
              {LOCALES.map((l) => (
                // Plain <a>: a language switch is a full page load (see language-switcher.tsx).
                <a
                  key={l}
                  href={localePath(l, base)}
                  hrefLang={LOCALE_META[l].hreflang}
                  aria-current={l === locale ? "true" : undefined}
                  className="rounded-lg py-2 text-center text-sm font-semibold text-ink-soft transition aria-[current]:bg-white aria-[current]:text-ink aria-[current]:shadow-[var(--shadow-card)]"
                >
                  {LOCALE_META[l].label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <a href={whatsappLink()} target="_blank" rel="noopener" className={buttonClass("whatsapp", "md", "px-3")}>
            <WhatsAppIcon /> {whatsappLabel}
          </a>
          <Link href={localePath(locale, "/wholesale")} onClick={close} className={buttonClass("primary", "md", "px-3")}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setPhase("open")}
        className="grid size-10 place-items-center rounded-xl border border-line bg-white text-ink shadow-[var(--shadow-xs)] transition-colors active:bg-sand"
        aria-label={menuLabel}
        aria-expanded={open}
      >
        <Menu className="size-5" />
      </button>
      {open && mounted && createPortal(sheet, document.body)}
    </div>
  );
}
