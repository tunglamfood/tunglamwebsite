"use client";

import { useState } from "react";
import { deleteProduct, saveProduct, type ProductInput } from "@/lib/admin/actions";
import type { AdminProduct } from "@/lib/admin/queries";
import { FormShell } from "@/components/admin/form-shell";
import { L10nField, L10nListField, NumberInput, Section, SelectInput, SlugInput, TextInput, Toggle } from "@/components/admin/fields";
import { ImageGallery } from "@/components/admin/image-field";

type Opt = { value: string; label: string };

export function ProductForm({
  initial,
  nextSort,
  brands,
  categories,
  mediaBase,
}: {
  initial: AdminProduct | null;
  nextSort: number;
  brands: Opt[];
  categories: Opt[];
  mediaBase: string;
}) {
  const [v, setV] = useState<ProductInput>(() => ({
    id: initial?.id,
    slug: initial?.slug ?? "",
    name: initial?.name ?? {},
    short: initial?.short ?? {},
    description: initial?.description ?? {},
    highlights: initial?.highlights ?? {},
    serving_ideas: initial?.serving_ideas ?? {},
    brand_id: initial?.brand_id ?? brands[0]?.value ?? null,
    category_id: initial?.category_id ?? null,
    net_weight: initial?.net_weight ?? "",
    images: initial?.images ?? [],
    is_featured: initial?.is_featured ?? false,
    is_published: initial?.is_published ?? true,
    meta_title: initial?.meta_title ?? {},
    meta_description: initial?.meta_description ?? {},
    sort: initial?.sort ?? nextSort,
  }));
  const set = <K extends keyof ProductInput>(k: K, val: ProductInput[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <FormShell
      title={initial ? (initial.name.en ?? "Product") : "New product"}
      backHref="/admin/products"
      viewHref={initial ? `/products/${initial.slug}` : null}
      isNew={!initial}
      editPath={(id) => `/admin/products/${id}`}
      onSave={() => saveProduct({ ...v, slug: v.slug || "" })}
      onDelete={initial ? () => deleteProduct(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-6">
          <Section title="Basics">
            <L10nField label="Product name" value={v.name} onChange={(x) => set("name", x)} required />
            <L10nField label="Short description" value={v.short} onChange={(x) => set("short", x)} multiline rows={2} maxHint={160} />
            <L10nField label="Full description" value={v.description} onChange={(x) => set("description", x)} multiline rows={8} placeholder="Separate paragraphs with a blank line." />
          </Section>

          <Section title="Images" description="The first image is the main photo shown on cards and the product page.">
            <ImageGallery value={v.images} onChange={(x) => set("images", x)} folder="products" name={v.slug || v.name.en || "product"} mediaBase={mediaBase} />
          </Section>

          <Section title="Details">
            <L10nListField label="Highlights" value={v.highlights} onChange={(x) => set("highlights", x)} />
            <L10nListField label="Serving ideas" value={v.serving_ideas} onChange={(x) => set("serving_ideas", x)} />
          </Section>

          <Section title="Search engine (SEO)" description="Leave blank to use the product name and short description.">
            <L10nField label="Meta title" value={v.meta_title} onChange={(x) => set("meta_title", x)} maxHint={60} />
            <L10nField label="Meta description" value={v.meta_description} onChange={(x) => set("meta_description", x)} multiline rows={3} maxHint={160} />
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Visibility">
            <Toggle label="Published" description="Show on the website" checked={v.is_published} onChange={(x) => set("is_published", x)} />
            <Toggle label="Featured" description="Show on the home page" checked={v.is_featured} onChange={(x) => set("is_featured", x)} />
          </Section>
          <Section title="Organisation">
            <SelectInput label="Category" value={v.category_id ?? ""} onChange={(x) => set("category_id", x || null)} options={categories} placeholder="— Select —" />
            <SelectInput label="Brand" value={v.brand_id ?? ""} onChange={(x) => set("brand_id", x || null)} options={brands} placeholder="— None —" />
            <TextInput label="Net weight / pack" value={v.net_weight ?? ""} onChange={(x) => set("net_weight", x)} placeholder="e.g. 500 g · 10 pcs" />
            <NumberInput label="Sort order" value={v.sort} onChange={(x) => set("sort", x ?? 0)} hint="Lower shows first" />
            <SlugInput value={v.slug} onChange={(x) => set("slug", x)} source={v.name.en} prefix="/products/" />
          </Section>
        </div>
      </div>
    </FormShell>
  );
}
