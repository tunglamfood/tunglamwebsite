"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALES, LOCALE_META, localePath, stripLocale, type Locale } from "@/lib/i18n";

/** Language menu: closes on outside click, Escape, or after choosing. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? "/";
  const base = stripLocale(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={clsx(
          "flex h-9 items-center gap-1.5 rounded-xl border bg-white px-2.5 text-sm font-semibold text-ink-soft shadow-[var(--shadow-xs)] transition-colors hover:border-ink/20 hover:text-ink",
          open ? "border-ink/20 text-ink" : "border-line",
        )}
      >
        <Globe className="size-4" aria-hidden />
        {LOCALE_META[locale].short}
        <ChevronDown className={clsx("size-3.5 text-muted transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      <ul
        role="menu"
        className={clsx(
          "menu-panel absolute right-0 top-full z-50 mt-2 w-48 origin-top-right p-1.5 transition duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0",
        )}
      >
        {LOCALES.map((l) => (
          <li key={l} role="none">
            {/* Plain <a>: switching language is a full page load (new <html lang>), and prefetching
                /ms or /zh would teach the client router that "/<word>" is a locale, breaking prefetch of /about etc. */}
            <a
              role="menuitem"
              href={localePath(l, base)}
              hrefLang={LOCALE_META[l].hreflang}
              lang={LOCALE_META[l].htmlLang}
              onClick={() => setOpen(false)}
              aria-current={l === locale ? "true" : undefined}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink aria-[current]:font-semibold aria-[current]:text-ink"
            >
              <span className="grid h-6 w-8 place-items-center rounded-md bg-sand text-[0.7rem] font-bold text-ink-soft">{LOCALE_META[l].short}</span>
              <span className="flex-1">{LOCALE_META[l].label}</span>
              {l === locale && <Check className="size-4 text-brand" aria-hidden />}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
