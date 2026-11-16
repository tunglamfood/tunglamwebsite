import { notFound } from "next/navigation";
import { adminCategories, adminGuide, adminGuides, adminProducts, adminRecipes } from "@/lib/admin/queries";
import { GuideForm } from "./guide-form";

export const metadata = { title: "Edit guide" };

export default async function EditGuide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [guide, products, categories, recipes, guides] = await Promise.all([adminGuide(id), adminProducts(), adminCategories(), adminRecipes(), adminGuides()]);
  if (id !== "new" && !guide) notFound();
  return (
    <GuideForm
      initial={guide}
      options={{
        products: products.map((p) => ({ value: p.slug, label: p.name.en ?? p.slug })),
        categories: categories.map((c) => ({ value: c.slug, label: c.name.en ?? c.slug })),
        recipes: recipes.map((r) => ({ value: r.slug, label: r.title.en ?? r.slug })),
        guides: guides.filter((g) => g.id !== id).map((g) => ({ value: g.slug, label: g.title.en ?? g.slug })),
      }}
      mediaBase={`${process.env.SUPABASE_URL}/storage/v1/object/public/media`}
    />
  );
}
