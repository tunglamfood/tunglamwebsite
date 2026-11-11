"use client";

import { createContext, useContext, useId, type ReactNode } from "react";
import clsx from "clsx";

export type Lang = "en" | "ms" | "zh";
export type L10n = Partial<Record<Lang, string>>;
export type L10nList = Partial<Record<Lang, string[]>>;

export const LANGS: { key: Lang; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "ms", label: "BM" },
  { key: "zh", label: "中文" },
];

/** The language currently being edited (one switch per form). */
export const EditLangContext = createContext<Lang>("en");
export const useEditLang = () => useContext(EditLangContext);

export const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[0.95rem] text-ink outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/10";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Dots({ filled }: { filled: Record<Lang, boolean> }) {
  return (
    <span className="inline-flex items-center gap-1" title="Translations filled: EN / BM / 中文">
      {LANGS.map((l) => (
        <span key={l.key} className={clsx("inline-flex items-center gap-0.5 text-[0.65rem] font-semibold", filled[l.key] ? "text-leaf" : "text-muted/50")}>
          <span className={clsx("size-1.5 rounded-full", filled[l.key] ? "bg-leaf" : "bg-line")} />
          {l.label}
        </span>
      ))}
    </span>
  );
}

/** Translatable text: edits the language chosen in the form's language switch. */
export function L10nField({
  label,
  value,
  onChange,
  multiline,
  rows = 3,
  required,
  maxHint,
  placeholder,
}: {
  label: string;
  value: L10n;
  onChange: (v: L10n) => void;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  maxHint?: number;
  placeholder?: string;
}) {
  const lang = useEditLang();
  const id = useId();
  const current = value?.[lang] ?? "";
  const filled = { en: !!value?.en?.trim(), ms: !!value?.ms?.trim(), zh: !!value?.zh?.trim() };
  const set = (s: string) => onChange({ ...value, [lang]: s });
  const count = maxHint ? <span className={clsx(current.length > maxHint && "font-semibold text-brand")}>{current.length}/{maxHint}</span> : null;
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required && lang === "en" && <span className="text-brand"> *</span>}
        </label>
        <span className="flex items-center gap-3 text-xs text-muted">
          {count}
          <Dots filled={filled} />
        </span>
      </div>
      {multiline ? (
        <textarea id={id} rows={rows} value={current} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={clsx(inputClass, "resize-y leading-relaxed")} />
      ) : (
        <input id={id} value={current} onChange={(e) => set(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
      {lang !== "en" && value?.en && (
        <p className="mt-1.5 line-clamp-3 rounded-md bg-sand/60 px-2.5 py-1.5 text-xs text-ink-soft">
          <span className="font-semibold">EN:</span> {value.en}
        </p>
      )}
    </div>
  );
}

/** Translatable list (one item per line). */
export function L10nListField({ label, value, onChange, rows = 4, hint }: { label: string; value: L10nList; onChange: (v: L10nList) => void; rows?: number; hint?: string }) {
  const lang = useEditLang();
  const id = useId();
  const current = (value?.[lang] ?? []).join("\n");
  const filled = { en: !!value?.en?.length, ms: !!value?.ms?.length, zh: !!value?.zh?.length };
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label} <span className="font-normal text-muted">— {hint ?? "one per line"}</span>
        </label>
        <Dots filled={filled} />
      </div>
      <textarea
        id={id}
        rows={rows}
        value={current}
        onChange={(e) => onChange({ ...value, [lang]: e.target.value.split("\n") })}
        className={clsx(inputClass, "resize-y leading-relaxed")}
      />
      {lang !== "en" && value?.en?.length ? (
        <p className="mt-1.5 rounded-md bg-sand/60 px-2.5 py-1.5 text-xs text-ink-soft">
          <span className="font-semibold">EN:</span> {value.en.filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, value, onChange, hint, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; hint?: ReactNode; placeholder?: string; type?: string }) {
  return (
    <Field label={label} hint={hint}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </Field>
  );
}

export function NumberInput({ label, value, onChange, hint, min = 0 }: { label: string; value: number | null; onChange: (v: number | null) => void; hint?: string; min?: number }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="number"
        min={min}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={inputClass}
      />
    </Field>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white p-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-leaf" : "bg-line")}
      >
        <span className={clsx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[1.375rem]" : "left-0.5")} />
      </button>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function SlugInput({ value, onChange, source, prefix }: { value: string; onChange: (v: string) => void; source?: string; prefix: string }) {
  return (
    <Field label="URL slug">
      <input value={value} onChange={(e) => onChange(slugify(e.target.value).slice(0, 120) || e.target.value.toLowerCase())} className={inputClass} placeholder="e.g. tl-egg-tofu-130g" />
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span className="truncate text-muted">
          {prefix}
          <span className="text-ink-soft">{value || "…"}</span>
        </span>
        {source && (
          <button type="button" className="font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline" onClick={() => onChange(slugify(source))}>
            Generate from name
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">Changing the slug of a live page changes its URL.</p>
    </Field>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
