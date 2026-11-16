import Link from "next/link";
import { LogOut } from "lucide-react";
import { requirePortal, getPortalDict } from "@/lib/portal/context";
import { logout } from "@/lib/portal/actions";
import { showPhone } from "@/lib/portal/phone";
import { whatsappLink } from "@/lib/site";
import { PageTitle } from "@/components/portal/bits";
import { WhatsAppIcon } from "@/components/ui/icons";

export const metadata = { title: "Account" };

export default async function PortalAccount() {
  const [ctx, d] = await Promise.all([requirePortal(), getPortalDict()]);
  const c = ctx.customer;
  const rows: [string, string | null | undefined][] = c
    ? [
        [d.account.dealer, c.name],
        [d.account.code, c.code],
        [d.account.address, c.address],
        [d.account.currency, c.currency],
      ]
    : [];

  return (
    <>
      <PageTitle title={d.account.title} />
      <div className="space-y-4">
        <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="whitespace-pre-wrap text-ink">{v}</dd>
            </div>
          ))}
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-sm text-muted">{d.account.signedIn}</dt>
            <dd className="text-ink">{showPhone(ctx.account.phone)}{ctx.account.name ? ` · ${ctx.account.name}` : ""}</dd>
          </div>
        </dl>

        {ctx.customers.length > 1 && (
          <Link href="/portal/dealers" className="flex h-11 items-center justify-center rounded-full border border-line bg-white font-semibold text-ink hover:border-ink/30">
            {d.account.switchDealer}
          </Link>
        )}
        <a href={whatsappLink()} target="_blank" rel="noopener" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#25d366] font-semibold text-white">
          <WhatsAppIcon /> {d.account.support}
        </a>
        <form action={logout}>
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-line bg-white font-semibold text-brand hover:bg-brand-50">
            <LogOut className="size-4" /> {d.account.logout}
          </button>
        </form>
      </div>
    </>
  );
}
