import { notFound } from "next/navigation";
import { adminProducts, adminRecipe } from "@/lib/admin/queries";
import { RecipeForm } from "./recipe-form";

export const metadata = { title: "Edit article" };

export default async function EditRecipe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recipe, products] = await Promise.all([adminRecipe(id), adminProducts()]);
  if (id !== "new" && !recipe) notFound();
  return (
    <RecipeForm
      initial={recipe}
      products={products.map((p) => ({ value: p.slug, label: p.name.en ?? p.slug }))}
      mediaBase={`${process.env.SUPABASE_URL}/storage/v1/object/public/media`}
    />
  );
}
