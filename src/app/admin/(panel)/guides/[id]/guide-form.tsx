"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteGuide, saveGuide, type GuideInput } from "@/lib/admin/actions";
import type { AdminGuide } from "@/lib/admin/queries";
import { FormShell } from "@/components/admin/form-shell";
import { Field, L10nField, L10nListField, Section, SlugInput, TextInput, Toggle, inputClass } from "@/components/admin/fields";
import { Repeater } from "@/components/admin/repeater";
import { SingleImage } from "@/components/admin/image-field";

type Opt = { value: string; label: string };

/** Pick several slugs from a list (products, categories, recipes, guides). */
function MultiPick({ label, hint, value, options, onChange }: { label: string; hint?: string; value: string[]; options: Opt[]; onChange: (v: string[]) => void }) {
  const name = new Map(options.map((o) => [o.value, o.label]));
  return (
    <div className="space-y-2">
      <Field label={label} hint={hint}>
        <select value="" onChange={(e) => e.target.value && !value.includes(e.target.value) && onChange([...value, e.target.value])} className={inputClass}>
          <option value="">Add…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((s) => (
            <li key={s} className="flex items-center justify-between gap-2 rounded-md bg-cream px-2.5 py-1.5 text-sm">
              <span className="truncate">{name.get(s) ?? s}</span>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} className="text-muted hover:text-brand" aria-label="Remove">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GuideForm({
  initial,
  options,
  mediaBase,
}: {
  initial: AdminGuide | null;
  options: { products: Opt[]; categories: Opt[]; recipes: Opt[]; guides: Opt[] };
  mediaBase: string;
}) {
  const [v, setV] = useState<GuideInput>(() => ({
    id: initial?.id,
    slug: initial?.slug ?? "",
    title: initial?.title ?? {},
    meta_title: initial?.meta_title ?? {},
    meta_description: initial?.meta_description ?? {},
    lead: initial?.lead ?? {},
    image_alt: initial?.image_alt ?? {},
    summary: initial?.summary ?? {},
    body: initial?.body ?? {},
    faqs: initial?.faqs ?? [],
    image_path: initial?.image_path ?? null,
    image_width: initial?.image_width ?? null,
    image_height: initial?.image_height ?? null,
    product_slugs: initial?.product_slugs ?? [],
    category_slugs: initial?.category_slugs ?? [],
    recipe_slugs: initial?.recipe_slugs ?? [],
    related_slugs: initial?.related_slugs ?? [],
    about: initial?.about ?? [],
    is_published: initial?.is_published ?? true,
    published_at: initial?.published_at ?? new Date().toISOString().slice(0, 10),
  }));
  const set = <K extends keyof GuideInput>(k: K, val: GuideInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const [aboutText, setAboutText] = useState(() => (initial?.about ?? []).join(", "));
  const about = () => aboutText.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <FormShell
      title={initial ? (initial.title.en ?? "Guide") : "New guide"}
      backHref="/admin/guides"
      viewHref={initial ? `/guides/${initial.slug}` : null}
      isNew={!initial}
      editPath={(id) => `/admin/guides/${id}`}
      onSave={() => saveGuide({ ...v, about: about() })}
      onDelete={initial ? () => deleteGuide(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-6">
          <Section title="Guide">
            <L10nField label="Title" value={v.title} onChange={(x) => set("title", x)} required maxHint={70} />
            <L10nField label="Lead" value={v.lead} onChange={(x) => set("lead", x)} multiline rows={3} />
            <L10nListField label="In short (answer box)" value={v.summary} onChange={(x) => set("summary", x)} rows={5} hint="one sentence per line, **bold** allowed" />
          </Section>

          <Section
            title="Article"
            description="Sections start with “## Heading {#id}” (same ids in every language). Also: ### subheading, - bullets, 1. steps, | tables |, > tip, **bold**, [link text](/products/slug)."
          >
            <L10nField label="Body" value={v.body} onChange={(x) => set("body", x)} multiline rows={24} />
          </Section>

          <Section title="FAQs">
            <Repeater
              items={v.faqs}
              onChange={(x) => set("faqs", x)}
              create={() => ({ q: {}, a: {} })}
              addLabel="Add FAQ"
              itemLabel={(i) => `FAQ ${i + 1}`}
              render={(f, update) => (
                <>
                  <L10nField label="Question" value={f.q} onChange={(q) => update({ ...f, q })} />
                  <L10nField label="Answer" value={f.a} onChange={(a) => update({ ...f, a })} multiline rows={3} />
                </>
              )}
            />
          </Section>

          <Section title="Search engine (SEO)">
            <L10nField label="Meta title" value={v.meta_title} onChange={(x) => set("meta_title", x)} maxHint={44} />
            <L10nField label="Meta description" value={v.meta_description} onChange={(x) => set("meta_description", x)} multiline rows={3} maxHint={160} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Publishing">
            <Toggle label="Published" description="Show on the website" checked={v.is_published} onChange={(x) => set("is_published", x)} />
            <TextInput label="Publish date" type="date" value={v.published_at} onChange={(x) => set("published_at", x)} />
          </Section>

          <Section title="Cover image">
            <SingleImage
              value={v.image_path ? { path: v.image_path, width: v.image_width ?? 0, height: v.image_height ?? 0 } : null}
              onChange={(img) => setV((s) => ({ ...s, image_path: img?.path ?? null, image_width: img?.width || null, image_height: img?.height || null }))}
              folder="guides"
              name={v.slug || v.title.en || "guide"}
              mediaBase={mediaBase}
            />
            <L10nField label="Image description (alt)" value={v.image_alt} onChange={(x) => set("image_alt", x)} />
          </Section>

          <Section title="Links">
            <MultiPick label="Products shown" value={v.product_slugs} options={options.products} onChange={(x) => set("product_slugs", x)} />
            <MultiPick label="Linked from product lines" hint="these category pages link here" value={v.category_slugs} options={options.categories} onChange={(x) => set("category_slugs", x)} />
            <MultiPick label="Recipes to try" value={v.recipe_slugs} options={options.recipes} onChange={(x) => set("recipe_slugs", x)} />
            <MultiPick label="More guides" value={v.related_slugs} options={options.guides} onChange={(x) => set("related_slugs", x)} />
            <TextInput
              label="Topics (about)"
              value={aboutText}
              onChange={setAboutText}
              hint="comma-separated, for search engines"
            />
          </Section>

          <Section title="URL">
            <SlugInput value={v.slug} onChange={(x) => set("slug", x)} source={v.title.en} prefix="/guides/" />
          </Section>
        </div>
      </div>
    </FormShell>
  );
}
