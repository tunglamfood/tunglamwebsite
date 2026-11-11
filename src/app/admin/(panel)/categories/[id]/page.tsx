import { notFound } from "next/navigation";
import { adminCategories, adminCategory } from "@/lib/admin/queries";
import { CategoryForm } from "./category-form";

export const metadata = { title: "Edit category" };

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [category, all] = await Promise.all([adminCategory(id), adminCategories()]);
  if (id !== "new" && !category) notFound();
  return (
    <CategoryForm
      initial={category}
      nextSort={Math.max(0, ...all.map((c) => c.sort)) + 1}
      parents={all.filter((c) => !c.parent_id && c.id !== id).map((c) => ({ value: c.id, label: c.name.en ?? c.slug }))}
      mediaBase={`${process.env.SUPABASE_URL}/storage/v1/object/public/media`}
    />
  );
}
