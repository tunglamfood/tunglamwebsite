import { requireAdmin } from "@/lib/admin/auth";
import { adminCounts } from "@/lib/admin/queries";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await adminCounts();
  return (
    <div>
      <AdminSidebar newInquiries={counts.newInquiries} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
