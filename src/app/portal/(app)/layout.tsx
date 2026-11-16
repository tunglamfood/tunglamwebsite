import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { pfmt } from "@/lib/portal/i18n";
import { showPhone } from "@/lib/portal/phone";
import { PortalShell } from "@/components/portal/shell";

export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  const demo = process.env.PORTAL_DEMO_OTP ? pfmt(d.demoBanner, { code: process.env.PORTAL_DEMO_OTP }) : null;
  return (
    <PortalShell
      scope={`${ctx.account.id}:${ctx.customer?.code ?? "none"}`}
      lang={lang}
      labels={{ nav: d.nav, orderingFor: d.home.orderingFor, switch: d.home.switch, search: d.products.search, support: d.account.support }}
      appName={d.appName}
      dealer={ctx.customer ? { name: ctx.customer.shortName || ctx.customer.name, code: ctx.customer.code } : null}
      canSwitch={ctx.customers.length > 1}
      demo={demo}
      user={ctx.account.name || showPhone(ctx.account.phone)}
    >
      {children}
    </PortalShell>
  );
}
