"use client";

import { useState } from "react";
import { deleteCategory, saveCategory, type CategoryInput } from "@/lib/admin/actions";
import type { Category } from "@/lib/data";
import { FormShell } from "@/components/admin/form-shell";
import { L10nField, NumberInput, Section, SelectInput, SlugInput } from "@/components/admin/fields";
import { Repeater } from "@/components/admin/repeater";
import { SingleImage } from "@/components/admin/image-field";

export function CategoryForm({
  initial,
  nextSort,
  parents,
  mediaBase,
}: {
  initial: Category | null;
  nextSort: number;
  parents: { value: string; label: string }[];
  mediaBase: string;
}) {
  const [v, setV] = useState<CategoryInput>(() => ({
    id: initial?.id,
    slug: initial?.slug ?? "",
    parent_id: initial ? initial.parent_id : (parents[0]?.value ?? null),
    name: initial?.name ?? {},
    tagline: initial?.tagline ?? {},
    intro: initial?.intro ?? {},
    faqs: initial?.faqs ?? [],
    image_path: initial?.image_path ?? null,
    meta_title: initial?.meta_title ?? {},
    meta_description: initial?.meta_description ?? {},
    sort: initial?.sort ?? nextSort,
  }));
  const set = <K extends keyof CategoryInput>(k: K, val: CategoryInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const isSeries = !v.parent_id;

  return (
    <FormShell
      title={initial ? (initial.name.en ?? "Category") : "New category"}
      backHref="/admin/categories"
      viewHref={initial ? `/products/${initial.slug}` : null}
      isNew={!initial}
      editPath={(id) => `/admin/categories/${id}`}
      onSave={() => saveCategory(v)}
      onDelete={initial ? () => deleteCategory(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-6">
          <Section title="Content">
            <L10nField label="Name" value={v.name} onChange={(x) => set("name", x)} required />
            <L10nField label="Tagline" value={v.tagline} onChange={(x) => set("tagline", x)} maxHint={90} />
            <L10nField label="Introduction" value={v.intro} onChange={(x) => set("intro", x)} multiline rows={7} placeholder="Shown below the product grid. Separate paragraphs with a blank line." />
          </Section>

          <Section title="FAQs" description="Shown on the category page (and to Google as FAQ rich results).">
            <Repeater
              items={v.faqs}
              onChange={(x) => set("faqs", x)}
              create={() => ({ q: {}, a: {} })}
              addLabel="Add question"
              itemLabel={(i) => `Question ${i + 1}`}
              render={(f, update) => (
                <>
                  <L10nField label="Question" value={f.q} onChange={(q) => update({ ...f, q })} />
                  <L10nField label="Answer" value={f.a} onChange={(a) => update({ ...f, a })} multiline rows={3} />
                </>
              )}
            />
          </Section>

          <Section title="Search engine (SEO)">
            <L10nField label="Meta title" value={v.meta_title} onChange={(x) => set("meta_title", x)} maxHint={60} />
            <L10nField label="Meta description" value={v.meta_description} onChange={(x) => set("meta_description", x)} multiline rows={3} maxHint={160} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Organisation">
            <SelectInput
              label="Parent series"
              value={v.parent_id ?? ""}
              onChange={(x) => set("parent_id", x || null)}
              options={parents}
              placeholder="— None (this is a series) —"
            />
            <NumberInput label="Sort order" value={v.sort} onChange={(x) => set("sort", x ?? 0)} hint="Lower shows first" />
            <SlugInput value={v.slug} onChange={(x) => set("slug", x)} source={v.name.en} prefix="/products/" />
          </Section>
          {isSeries && (
            <Section title="Cover image" description="Used on the home page series card and the category page.">
              <SingleImage
                value={v.image_path ? { path: v.image_path, width: 0, height: 0 } : null}
                onChange={(img) => set("image_path", img?.path ?? null)}
                folder="categories"
                name={v.slug || "category"}
                mediaBase={mediaBase}
              />
            </Section>
          )}
        </div>
      </div>
    </FormShell>
  );
}
