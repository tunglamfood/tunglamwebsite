import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { PortalShell } from "@/components/portal/shell";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  return (
    <PortalShell
      scope={`${ctx.account.id}:${ctx.customer?.code ?? "none"}`}
      lang={lang}
      labels={{ nav: d.nav, orderingFor: d.home.orderingFor, switch: d.home.switch, search: d.products.search, help: d.shell.help, whatsapp: d.shell.whatsapp }}
      appName={d.appName}
      dealer={ctx.customer ? { name: ctx.customer.name } : null}
      canSwitch={ctx.customers.length > 1}
    >
      {children}
    </PortalShell>
  );
}
