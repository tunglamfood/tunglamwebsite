"use client";

import { useState } from "react";
import { deleteFaq, saveFaq, type FaqInput } from "@/lib/admin/actions";
import type { SiteFaq } from "@/lib/data";
import { FormShell } from "@/components/admin/form-shell";
import { L10nField, NumberInput, Section, SelectInput } from "@/components/admin/fields";

export function FaqForm({ initial, nextSort }: { initial: SiteFaq | null; nextSort: number }) {
  const [v, setV] = useState<FaqInput>(() => ({
    id: initial?.id,
    grp: (initial?.grp as FaqInput["grp"]) ?? "products",
    question: initial?.question ?? {},
    answer: initial?.answer ?? {},
    sort: initial?.sort ?? nextSort,
  }));
  const set = <K extends keyof FaqInput>(k: K, val: FaqInput[K]) => setV((s) => ({ ...s, [k]: val }));
  return (
    <FormShell
      title={initial ? "Edit FAQ" : "New FAQ"}
      backHref="/admin/faqs"
      viewHref="/faq"
      isNew={!initial}
      editPath={(id) => `/admin/faqs/${id}`}
      onSave={() => saveFaq(v)}
      onDelete={initial ? () => deleteFaq(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <Section title="Question & answer">
          <L10nField label="Question" value={v.question} onChange={(x) => set("question", x)} required />
          <L10nField label="Answer" value={v.answer} onChange={(x) => set("answer", x)} multiline rows={6} required />
        </Section>
        <Section title="Organisation">
          <SelectInput
            label="Group"
            value={v.grp}
            onChange={(x) => set("grp", x as FaqInput["grp"])}
            options={[
              { value: "products", label: "Products" },
              { value: "ordering", label: "Ordering & wholesale" },
              { value: "company", label: "Company" },
            ]}
          />
          <NumberInput label="Sort order" value={v.sort} onChange={(x) => set("sort", x ?? 0)} hint="Lower shows first" />
        </Section>
      </div>
    </FormShell>
  );
}
