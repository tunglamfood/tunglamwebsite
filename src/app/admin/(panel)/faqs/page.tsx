import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { adminFaqs } from "@/lib/admin/queries";
import { AdminHeader, Card, CardHeader, NewButton } from "@/components/admin/ui";

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
            <Card key={g.key} className="overflow-hidden">
              <CardHeader title={g.label} count={items.length} />
              <ul className="divide-y divide-line">
                {items.map((f) => (
                  <li key={f.id}>
                    <Link href={`/admin/faqs/${f.id}`} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream sm:px-5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{f.question.en}</span>
                        <span className="block truncate text-xs text-muted">{f.answer.en}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
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
