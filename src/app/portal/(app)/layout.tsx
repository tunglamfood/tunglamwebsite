import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { PortalShell } from "@/components/portal/shell";
import { getOrderUpdates } from "@/lib/portal/data";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  // Only the dealer being ordered for: a rep's badge should not count other dealers' orders.
  const updates = ctx.customer ? await getOrderUpdates([ctx.customer.code]) : [];
  return (
    <PortalShell
      scope={`${ctx.account.id}:${ctx.customer?.code ?? "none"}`}
      lang={lang}
      labels={{ nav: d.nav, orderingFor: d.home.orderingFor, switch: d.home.switch, search: d.products.search, help: d.shell.help, whatsapp: d.shell.whatsapp }}
      appName={d.appName}
      dealer={ctx.customer ? { name: ctx.customer.name } : null}
      canSwitch={ctx.customers.length > 1}
      updates={updates.map((u) => ({ orderNo: u.orderNo, at: u.at }))}
      isRep={ctx.account.role === "rep"}
    >
      {children}
    </PortalShell>
  );
}
