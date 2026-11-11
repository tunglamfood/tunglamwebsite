"use client";

import { useState } from "react";
import { deleteBrand, saveBrand, type BrandInput } from "@/lib/admin/actions";
import type { Brand } from "@/lib/data";
import { FormShell } from "@/components/admin/form-shell";
import { L10nField, NumberInput, Section, SlugInput, TextInput } from "@/components/admin/fields";
import { SingleImage } from "@/components/admin/image-field";

export function BrandForm({ initial, nextSort, mediaBase }: { initial: Brand | null; nextSort: number; mediaBase: string }) {
  const [v, setV] = useState<BrandInput>(() => ({
    id: initial?.id,
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    tagline: initial?.tagline ?? {},
    description: initial?.description ?? {},
    logo_path: initial?.logo_path ?? null,
    meta_title: initial?.meta_title ?? {},
    meta_description: initial?.meta_description ?? {},
    sort: initial?.sort ?? nextSort,
  }));
  const set = <K extends keyof BrandInput>(k: K, val: BrandInput[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <FormShell
      title={initial?.name ?? "New brand"}
      backHref="/admin/brands"
      viewHref={initial ? `/brands/${initial.slug}` : null}
      isNew={!initial}
      editPath={(id) => `/admin/brands/${id}`}
      onSave={() => saveBrand(v)}
      onDelete={initial ? () => deleteBrand(initial.id) : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
        <div className="space-y-6">
          <Section title="Content">
            <TextInput label="Brand name" value={v.name} onChange={(x) => set("name", x)} />
            <L10nField label="Tagline" value={v.tagline} onChange={(x) => set("tagline", x)} />
            <L10nField label="Description" value={v.description} onChange={(x) => set("description", x)} multiline rows={6} />
          </Section>
          <Section title="Search engine (SEO)">
            <L10nField label="Meta title" value={v.meta_title} onChange={(x) => set("meta_title", x)} maxHint={60} />
            <L10nField label="Meta description" value={v.meta_description} onChange={(x) => set("meta_description", x)} multiline rows={3} maxHint={160} />
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Logo" description="Leave empty to keep the built-in logo.">
            <SingleImage
              value={v.logo_path ? { path: v.logo_path, width: 0, height: 0 } : null}
              onChange={(img) => set("logo_path", img?.path ?? null)}
              folder="brands"
              name={v.slug || v.name || "brand"}
              mediaBase={mediaBase}
              contain
            />
          </Section>
          <Section title="Organisation">
            <NumberInput label="Sort order" value={v.sort} onChange={(x) => set("sort", x ?? 0)} />
            <SlugInput value={v.slug} onChange={(x) => set("slug", x)} source={v.name} prefix="/brands/" />
          </Section>
        </div>
      </div>
    </FormShell>
  );
}
