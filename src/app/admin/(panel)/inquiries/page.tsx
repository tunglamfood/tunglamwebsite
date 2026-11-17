import { adminInquiries } from "@/lib/admin/queries";
import { AdminHeader, Card, EmptyState, FilterTabs } from "@/components/admin/ui";
import { InquiryRow } from "./inquiry-row";
import { OFFICE_URL } from "@/lib/office";

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
      <p className="mb-5 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-soft">
        Dealer, product and general enquiries also go straight to the sales team in the office system, under{" "}
        <a href={`${OFFICE_URL}/sales/enquiries`} target="_blank" rel="noopener" className="font-semibold text-ink underline underline-offset-2">
          Sales → Enquiries
        </a>
        , where they are followed up. Job applications stay only here.
      </p>
      <FilterTabs active={status} tabs={STATUSES.map((s) => ({ key: s.key, label: s.label, count: count(s.key), href: `/admin/inquiries?status=${s.key}` }))} />
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState>No enquiries here. Messages from the website forms will appear here.</EmptyState>
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
