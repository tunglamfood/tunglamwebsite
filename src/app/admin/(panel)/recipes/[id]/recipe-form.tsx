"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteRecipe, saveRecipe, type RecipeInput } from "@/lib/admin/actions";
import type { AdminRecipe } from "@/lib/admin/queries";
import { FormShell } from "@/components/admin/form-shell";
import { Field, L10nField, L10nListField, NumberInput, Section, SelectInput, SlugInput, TextInput, Toggle, inputClass } from "@/components/admin/fields";
import { Repeater } from "@/components/admin/repeater";
import { SingleImage } from "@/components/admin/image-field";

type Opt = { value: string; label: string };

export function RecipeForm({ initial, products, mediaBase }: { initial: AdminRecipe | null; products: Opt[]; mediaBase: string }) {
  const [v, setV] = useState<RecipeInput>(() => ({
    id: initial?.id,
    slug: initial?.slug ?? "",
    title: initial?.title ?? {},
    excerpt: initial?.excerpt ?? {},
    intro: initial?.intro ?? {},
    image_path: initial?.image_path ?? null,
    image_width: initial?.image_width ?? null,
    image_height: initial?.image_height ?? null,
    prep_minutes: initial?.prep_minutes ?? null,
    cook_minutes: initial?.cook_minutes ?? null,
    servings: initial?.servings ?? null,
    difficulty: (initial?.difficulty as "easy" | "medium" | null) ?? "easy",
    cuisine: initial?.cuisine ?? { en: "Malaysian" },
    course: initial?.course ?? {},
    ingredients: initial?.ingredients ?? [{ group: null, items: {} }],
    steps: initial?.steps ?? [{ title: null, text: {} }],
    tips: initial?.tips ?? {},
    keywords: initial?.keywords ?? {},
    product_slugs: initial?.product_slugs ?? [],
    is_published: initial?.is_published ?? true,
    published_at: initial?.published_at ?? new Date().toISOString().slice(0, 10),
    meta_title: initial?.meta_title ?? {},
    meta_description: initial?.meta_description ?? {},
  }));
  const set = <K extends keyof RecipeInput>(k: K, val: RecipeInput[K]) => setV((s) => ({ ...s, [k]: val }));
  const productLabel = new Map(products.map((p) => [p.value, p.label]));

  return (
    <FormShell
      title={initial ? (initial.title.en ?? "Article") : "New recipe / article"}
      backHref="/admin/recipes"
      viewHref={initial ? `/recipes/${initial.slug}` : null}
      isNew={!initial}
      editPath={(id) => `/admin/recipes/${id}`}
      onSave={() => saveRecipe(v)}
      onDelete={initial ? () => deleteRecipe(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-6">
          <Section title="Article">
            <L10nField label="Title" value={v.title} onChange={(x) => set("title", x)} required maxHint={65} />
            <L10nField label="Excerpt" value={v.excerpt} onChange={(x) => set("excerpt", x)} multiline rows={2} maxHint={180} />
            <L10nField label="Introduction" value={v.intro} onChange={(x) => set("intro", x)} multiline rows={4} />
          </Section>

          <Section title="Ingredients" description="Optional groups, e.g. “For the sauce”. One ingredient per line.">
            <Repeater
              items={v.ingredients}
              onChange={(x) => set("ingredients", x)}
              create={() => ({ group: null, items: {} })}
              addLabel="Add ingredient group"
              itemLabel={(i) => `Group ${i + 1}`}
              render={(g, update) => (
                <>
                  <L10nField label="Group name (optional)" value={g.group ?? {}} onChange={(group) => update({ ...g, group })} />
                  <L10nListField label="Ingredients" value={g.items} onChange={(items) => update({ ...g, items })} rows={5} />
                </>
              )}
            />
          </Section>

          <Section title="Method">
            <Repeater
              items={v.steps}
              onChange={(x) => set("steps", x)}
              create={() => ({ title: null, text: {} })}
              addLabel="Add step"
              itemLabel={(i) => `Step ${i + 1}`}
              render={(s, update) => (
                <>
                  <L10nField label="Step title (optional)" value={s.title ?? {}} onChange={(title) => update({ ...s, title })} />
                  <L10nField label="Instructions" value={s.text} onChange={(text) => update({ ...s, text })} multiline rows={3} />
                </>
              )}
            />
          </Section>

          <Section title="Extras">
            <L10nListField label="Tips" value={v.tips} onChange={(x) => set("tips", x)} rows={3} />
            <L10nListField label="Keywords" value={v.keywords} onChange={(x) => set("keywords", x)} rows={3} hint="one per line, used for SEO" />
          </Section>

          <Section title="Search engine (SEO)" description="Leave blank to use the title and excerpt.">
            <L10nField label="Meta title" value={v.meta_title} onChange={(x) => set("meta_title", x)} maxHint={60} />
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
              folder="recipes"
              name={v.slug || v.title.en || "recipe"}
              mediaBase={mediaBase}
            />
          </Section>

          <Section title="Recipe details">
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Prep (min)" value={v.prep_minutes ?? null} onChange={(x) => set("prep_minutes", x)} />
              <NumberInput label="Cook (min)" value={v.cook_minutes ?? null} onChange={(x) => set("cook_minutes", x)} />
              <NumberInput label="Serves" value={v.servings ?? null} onChange={(x) => set("servings", x)} />
              <SelectInput
                label="Difficulty"
                value={v.difficulty ?? ""}
                onChange={(x) => set("difficulty", (x || null) as "easy" | "medium" | null)}
                options={[
                  { value: "easy", label: "Easy" },
                  { value: "medium", label: "Medium" },
                ]}
                placeholder="—"
              />
            </div>
            <L10nField label="Cuisine" value={v.cuisine} onChange={(x) => set("cuisine", x)} />
            <L10nField label="Course" value={v.course} onChange={(x) => set("course", x)} placeholder="e.g. Main, Dessert, Drink" />
          </Section>

          <Section title="Products used">
            <Field label="Linked products">
              <select
                value=""
                onChange={(e) => e.target.value && !v.product_slugs.includes(e.target.value) && set("product_slugs", [...v.product_slugs, e.target.value])}
                className={inputClass}
              >
                <option value="">Add a product…</option>
                {products.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            {v.product_slugs.length > 0 && (
              <ul className="space-y-1.5">
                {v.product_slugs.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-2 rounded-md bg-cream px-2.5 py-1.5 text-sm">
                    <span className="truncate">{productLabel.get(s) ?? s}</span>
                    <button type="button" onClick={() => set("product_slugs", v.product_slugs.filter((x) => x !== s))} className="text-muted hover:text-brand" aria-label="Remove">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="URL">
            <SlugInput value={v.slug} onChange={(x) => set("slug", x)} source={v.title.en} prefix="/recipes/" />
          </Section>
        </div>
      </div>
    </FormShell>
  );
}
