"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { inputClass } from "./fields";

/** Search box + optional select filters, synced to the URL query string. */
export function ListSearch({
  placeholder,
  filters = [],
}: {
  placeholder: string;
  filters?: { name: string; label: string; options: { value: string; label: string }[] }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const push = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`);
  };

  useEffect(() => {
    if ((params.get("q") ?? "") === q) return;
    const t = setTimeout(() => push("q", q.trim()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-9`} />
      </label>
      {filters.map((f) => (
        <select key={f.name} value={params.get(f.name) ?? ""} onChange={(e) => push(f.name, e.target.value)} className={`${inputClass} sm:w-56`}>
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
