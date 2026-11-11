import { notFound } from "next/navigation";
import { adminBrand, adminBrands } from "@/lib/admin/queries";
import { BrandForm } from "./brand-form";

export const metadata = { title: "Edit brand" };

export default async function EditBrand({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [brand, all] = await Promise.all([adminBrand(id), adminBrands()]);
  if (id !== "new" && !brand) notFound();
  return (
    <BrandForm
      initial={brand}
      nextSort={Math.max(0, ...all.map((b) => b.sort)) + 1}
      mediaBase={`${process.env.SUPABASE_URL}/storage/v1/object/public/media`}
    />
  );
}
