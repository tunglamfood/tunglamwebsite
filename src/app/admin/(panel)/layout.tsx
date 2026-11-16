import { requireAdmin } from "@/lib/admin/auth";
import { adminCounts } from "@/lib/admin/queries";
import { AdminShell } from "@/components/admin/sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const counts = await adminCounts();
  return <AdminShell newInquiries={counts.newInquiries}>{children}</AdminShell>;
}
