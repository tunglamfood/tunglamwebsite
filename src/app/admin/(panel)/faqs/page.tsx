import Link from "next/link";
import { adminFaqs } from "@/lib/admin/queries";
import { AdminHeader, Card, NewButton } from "@/components/admin/ui";

export const metadata = { title: "FAQs" };

const GROUPS = [
  { key: "products", label: "Products" },
  { key: "ordering", label: "Ordering & wholesale" },
  { key: "company", label: "Company" },
];

export default async function FaqsAdmin() {
  const faqs = await adminFaqs();
  return (
    <>
      <AdminHeader title="FAQs" description="Shown on the FAQ page. Category FAQs are edited inside each category." action={<NewButton href="/admin/faqs/new" label="New FAQ" />} />
      <div className="space-y-4">
        {GROUPS.map((g) => {
          const items = faqs.filter((f) => f.grp === g.key);
          if (!items.length) return null;
          return (
            <Card key={g.key}>
              <p className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">{g.label}</p>
              <ul className="divide-y divide-line">
                {items.map((f) => (
                  <li key={f.id}>
                    <Link href={`/admin/faqs/${f.id}`} className="block px-4 py-2.5 hover:bg-cream">
                      <span className="block truncate text-sm text-ink">{f.question.en}</span>
                      <span className="block truncate text-xs text-muted">{f.answer.en}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
