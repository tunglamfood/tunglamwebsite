"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";

/**
 * Phone number with a country prefix (Malaysia +60 by default, Singapore +65).
 * The person types their local number in whatever way they like — "012-345 6789",
 * "12 345 6789", even "+60 12…" pasted — and it is tidied as they type.
 * The form receives the full international number in a hidden field.
 */
const COUNTRIES = {
  MY: { dial: "60", code: "MY", maxDigits: 10, minDigits: 9, placeholder: "12-345 6789" },
  SG: { dial: "65", code: "SG", maxDigits: 8, minDigits: 8, placeholder: "9123 4567" },
} as const;
type Country = keyof typeof COUNTRIES;

/** Local digits without the trunk 0 or the country code. */
function localDigits(raw: string, country: Country): string {
  let d = raw.replace(/\D/g, "");
  const dial = COUNTRIES[country].dial;
  if (raw.trim().startsWith("+") || d.length > COUNTRIES[country].maxDigits) {
    if (d.startsWith(dial)) d = d.slice(dial.length);
  }
  if (country === "MY" && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, COUNTRIES[country].maxDigits);
}

/** 12-345 6789 · 11-2345 6789 (Malaysia), 9123 4567 (Singapore). */
function format(d: string, country: Country): string {
  if (country === "SG") return d.length > 4 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
  if (d.length <= 2) return d;
  const head = d.slice(0, 2);
  const rest = d.slice(2);
  const split = d.startsWith("11") || d.length > 9 ? 4 : 3; // 011 numbers have one more digit
  return rest.length <= split ? `${head}-${rest}` : `${head}-${rest.slice(0, split)} ${rest.slice(split)}`;
}

function CountryChip({ code }: { code: string }) {
  return <span className="grid h-5 w-7 place-items-center rounded-md bg-ink text-[0.62rem] font-bold tracking-wide text-white">{code}</span>;
}

export function PhoneField({ label, name = "phone", className = "" }: { label: string; name?: string; className?: string }) {
  const [country, setCountry] = useState<Country>("MY");
  const [digits, setDigits] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const c = COUNTRIES[country];
  const complete = digits.length >= c.minDigits;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (next: Country) => {
    setCountry(next);
    setDigits((d) => d.slice(0, COUNTRIES[next].maxDigits));
    setOpen(false);
    input.current?.focus();
  };

  return (
    <div className={`block ${className}`}>
      <label htmlFor={`${name}-local`} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div ref={box} className="relative">
        <div className="flex h-[3.25rem] rounded-xl border border-line bg-white shadow-[var(--shadow-xs)] transition focus-within:border-ink/40 focus-within:ring-4 focus-within:ring-ink/5 hover:border-ink/20">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Country code"
            className="flex shrink-0 items-center gap-2 rounded-l-xl border-r border-line bg-cream pl-3 pr-2.5 text-base font-semibold text-ink outline-none transition-colors hover:bg-sand"
          >
            <CountryChip code={c.code} />
            +{c.dial}
            <ChevronDown className={clsx("size-4 text-muted transition-transform duration-200", open && "rotate-180")} aria-hidden />
          </button>
          <input
            ref={input}
            id={`${name}-local`}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required
            value={format(digits, country)}
            placeholder={c.placeholder}
            onChange={(e) => {
              const raw = e.target.value;
              // Pasting a Singapore number while Malaysia is selected switches the country.
              if (country === "MY" && /^\s*\+?\s*65/.test(raw) && raw.replace(/\D/g, "").length >= 10) {
                setCountry("SG");
                setDigits(localDigits(raw, "SG"));
                return;
              }
              setDigits(localDigits(raw, country));
            }}
            className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3.5 text-lg tracking-wide text-ink outline-none placeholder:text-muted/60"
          />
        </div>

        <ul
          role="listbox"
          aria-label="Country code"
          className={clsx(
            "menu-panel absolute left-0 top-full z-20 mt-2 w-56 origin-top-left p-1.5 transition duration-150 ease-out",
            open ? "visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0",
          )}
        >
          {(Object.keys(COUNTRIES) as Country[]).map((k) => (
            <li key={k} role="option" aria-selected={k === country}>
              <button
                type="button"
                onClick={() => choose(k)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[0.95rem] transition-colors hover:bg-sand",
                  k === country ? "font-semibold text-ink" : "text-ink-soft",
                )}
              >
                <CountryChip code={COUNTRIES[k].code} />
                <span className="flex-1 tabular-nums">+{COUNTRIES[k].dial}</span>
                {k === country && <Check className="size-4 text-brand" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* What the server gets: the full international number, e.g. +60123456789. */}
      <input type="hidden" name={name} value={digits ? `+${c.dial}${digits}` : ""} />
      {digits.length > 0 && !complete && <span className="sr-only">Number incomplete</span>}
    </div>
  );
}
