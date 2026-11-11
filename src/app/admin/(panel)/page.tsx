import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminCounts, adminInquiries } from "@/lib/admin/queries";
import { AdminHeader, Badge, Card, EmptyState } from "@/components/admin/ui";
import { RefreshButton } from "@/components/admin/refresh-button";

export const metadata = { title: "Dashboard" };

const KIND: Record<string, string> = { general: "General", wholesale: "Wholesale", product: "Product", career: "Career" };

export default async function Dashboard() {
  const [c, inquiries] = await Promise.all([adminCounts(), adminInquiries("all")]);
  const stats = [
    { label: "Products", value: c.products, note: c.unpublished ? `${c.unpublished} hidden` : "All published", href: "/admin/products" },
    { label: "Recipes & articles", value: c.recipes, href: "/admin/recipes" },
    { label: "FAQs", value: c.faqs, href: "/admin/faqs" },
    { label: "New enquiries", value: c.newInquiries, note: `${c.inquiries} total`, href: "/admin/inquiries?status=new" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" description="Manage the content of tunglamfood.my." action={<RefreshButton />} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-line bg-white p-4 transition hover:border-ink/20">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{s.value}</p>
            {s.note && <p className="mt-0.5 text-xs text-muted">{s.note}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent enquiries</h2>
            <Link href="/admin/inquiries" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
              View all <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <Card>
            {inquiries.length === 0 ? (
              <EmptyState>No enquiries yet. Messages from the website forms will appear here.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {inquiries.slice(0, 6).map((q) => (
                  <li key={q.id}>
                    <Link href={`/admin/inquiries?open=${q.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {q.name}
                          {q.company && <span className="font-normal text-muted"> · {q.company}</span>}
                        </p>
                        <p className="truncate text-sm text-muted">{q.message || q.product_slug || "—"}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={q.status === "new" ? "red" : "neutral"}>{q.status === "new" ? "New" : KIND[q.kind]}</Badge>
                        <span className="text-xs text-muted">{new Date(q.created_at).toLocaleDateString("en-MY", { day: "numeric", month: "short" })}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Quick actions</h2>
          <Card className="divide-y divide-line">
            {[
              ["/admin/products/new", "Add a product"],
              ["/admin/recipes/new", "Write a recipe or article"],
              ["/admin/faqs/new", "Add an FAQ"],
              ["/admin/categories", "Edit categories"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="flex items-center justify-between px-4 py-3 text-sm text-ink-soft hover:bg-cream hover:text-ink">
                {label} <ArrowRight className="size-3.5 text-muted" />
              </Link>
            ))}
          </Card>
        </section>
      </div>
    </>
  );
}
