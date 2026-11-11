import { notFound } from "next/navigation";
import { adminBrands, adminCategories, adminProduct, adminProducts } from "@/lib/admin/queries";
import { ProductForm } from "./product-form";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, brands, categories, all] = await Promise.all([adminProduct(id), adminBrands(), adminCategories(), adminProducts()]);
  if (id !== "new" && !product) notFound();
  const parentName = new Map(categories.map((c) => [c.id, c.name.en]));
  return (
    <ProductForm
      initial={product}
      nextSort={Math.max(0, ...all.map((p) => p.sort)) + 1}
      brands={brands.map((b) => ({ value: b.id, label: b.name }))}
      categories={categories
        .filter((c) => c.parent_id)
        .map((c) => ({ value: c.id, label: `${parentName.get(c.parent_id!) ?? ""} › ${c.name.en}` }))}
      mediaBase={`${process.env.SUPABASE_URL}/storage/v1/object/public/media`}
    />
  );
}
