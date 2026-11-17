import { requireAdmin } from "@/lib/admin/auth";
import { adminCounts } from "@/lib/admin/queries";
import { AdminShell } from "@/components/admin/sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const counts = await adminCounts();
  return (
    <AdminShell newInquiries={counts.newInquiries} user={{ name: me.name, username: me.username }}>
      {children}
    </AdminShell>
  );
}
