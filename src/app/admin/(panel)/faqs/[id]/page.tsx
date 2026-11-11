import { notFound } from "next/navigation";
import { adminFaq, adminFaqs } from "@/lib/admin/queries";
import { FaqForm } from "./faq-form";

export const metadata = { title: "Edit FAQ" };

export default async function EditFaq({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [faq, all] = await Promise.all([adminFaq(id), adminFaqs()]);
  if (id !== "new" && !faq) notFound();
  return <FaqForm initial={faq} nextSort={Math.max(0, ...all.map((f) => f.sort)) + 1} />;
}
