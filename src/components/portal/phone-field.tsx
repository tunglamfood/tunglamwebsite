"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Phone number with a country prefix (Malaysia +60 by default, Singapore +65).
 * The person types their local number in whatever way they like — "012-345 6789",
 * "12 345 6789", even "+60 12…" pasted — and it is tidied as they type.
 * The form receives the full international number in a hidden field.
 */
const COUNTRIES = {
  MY: { dial: "60", label: "MY +60", maxDigits: 10, minDigits: 9, placeholder: "12-345 6789" },
  SG: { dial: "65", label: "SG +65", maxDigits: 8, minDigits: 8, placeholder: "9123 4567" },
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

export function PhoneField({ label, name = "phone", className = "" }: { label: string; name?: string; className?: string }) {
  const [country, setCountry] = useState<Country>("MY");
  const [digits, setDigits] = useState("");
  const c = COUNTRIES[country];
  const complete = digits.length >= c.minDigits;

  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      <div className="flex h-[3.25rem] overflow-hidden rounded-xl border border-line bg-white transition focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
        <span className="relative flex shrink-0 items-center border-r border-line bg-cream">
          <select
            aria-label="Country code"
            value={country}
            onChange={(e) => {
              const next = e.target.value as Country;
              setCountry(next);
              setDigits((d) => d.slice(0, COUNTRIES[next].maxDigits));
            }}
            className="h-full appearance-none bg-transparent pl-3 pr-8 text-base font-semibold text-ink outline-none"
          >
            {(Object.keys(COUNTRIES) as Country[]).map((k) => (
              <option key={k} value={k}>{COUNTRIES[k].label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-muted" aria-hidden />
        </span>
        <input
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
          className="min-w-0 flex-1 bg-transparent px-3.5 text-lg tracking-wide text-ink outline-none placeholder:text-muted/60"
        />
      </div>
      {/* What the server gets: the full international number, e.g. +60123456789. */}
      <input type="hidden" name={name} value={digits ? `+${c.dial}${digits}` : ""} />
      {digits.length > 0 && !complete && <span className="sr-only">Number incomplete</span>}
    </label>
  );
}
