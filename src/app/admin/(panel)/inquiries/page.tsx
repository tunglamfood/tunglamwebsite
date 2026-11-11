import { adminInquiries } from "@/lib/admin/queries";
import { AdminHeader, Card, EmptyState, FilterTabs } from "@/components/admin/ui";
import { InquiryRow } from "./inquiry-row";

export const metadata = { title: "Enquiries" };

const STATUSES = [
  { key: "new", label: "New" },
  { key: "in_progress", label: "In progress" },
  { key: "closed", label: "Closed" },
  { key: "spam", label: "Spam" },
  { key: "all", label: "All" },
];

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<{ status?: string; open?: string }> }) {
  const { status = "new", open } = await searchParams;
  const all = await adminInquiries("all");
  const rows = status === "all" ? all : all.filter((q) => q.status === status);
  const count = (k: string) => (k === "all" ? all.length : all.filter((q) => q.status === k).length);
  return (
    <>
      <AdminHeader title="Enquiries" description="Messages sent from the website's enquiry forms." />
      <FilterTabs active={status} tabs={STATUSES.map((s) => ({ key: s.key, label: s.label, count: count(s.key), href: `/admin/inquiries?status=${s.key}` }))} />
      <Card>
        {rows.length === 0 ? (
          <EmptyState>No enquiries here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((q) => (
              <InquiryRow key={q.id} inquiry={q} defaultOpen={q.id === open} />
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
