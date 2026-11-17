import Link from "next/link";
import { ArrowLeftRight, ChevronRight, LogOut, UserRound, Wallet } from "lucide-react";
import { requirePortal, getPortalDict } from "@/lib/portal/context";
import { logout } from "@/lib/portal/actions";
import { showPhone } from "@/lib/portal/phone";
import { whatsappLink } from "@/lib/site";
import { PageTitle, pcard } from "@/components/portal/bits";
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
        [d.account.terms, c.paymentTerms],
      ]
    : [];
  const who = ctx.account.name || showPhone(ctx.account.phone);
  const row = "flex h-14 w-full items-center gap-3 px-4 text-left font-medium transition-colors sm:px-5";

  return (
    <>
      <PageTitle title={d.account.title} />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className={`${pcard} overflow-hidden`}>
          <div className="flex items-center gap-4 border-b border-line p-4 sm:p-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-ink-soft">
              <UserRound className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-ink">{who}</p>
              <p className="text-sm text-muted">
                {d.account.signedIn} {showPhone(ctx.account.phone)}
              </p>
            </div>
          </div>
          <dl className="divide-y divide-line">
            {rows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="grid gap-0.5 px-4 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4 sm:px-5">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="whitespace-pre-wrap font-medium text-ink">{v}</dd>
                </div>
              ))}
          </dl>
        </div>

        <div className={`${pcard} divide-y divide-line overflow-hidden`}>
          <Link href="/portal/payments" className={`${row} text-ink hover:bg-cream`}>
            <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
              <Wallet className="size-4" aria-hidden />
            </span>
            {d.payments.cta}
          </Link>
          {ctx.customers.length > 1 && (
            <Link href="/portal/dealers" className={`${row} text-ink hover:bg-cream`}>
              <span className="grid size-9 place-items-center rounded-xl bg-sand text-ink-soft">
                <ArrowLeftRight className="size-4" aria-hidden />
              </span>
              <span className="flex-1">{d.account.switchDealer}</span>
              <ChevronRight className="size-4 text-muted" aria-hidden />
            </Link>
          )}
          <a href={whatsappLink()} target="_blank" rel="noopener" className={`${row} text-ink hover:bg-cream`}>
            <span className="grid size-9 place-items-center rounded-xl bg-[#1fa855]/10 text-[#1fa855]">
              <WhatsAppIcon className="size-[1.125rem]" />
            </span>
            <span className="flex-1">{d.account.support}</span>
            <ChevronRight className="size-4 text-muted" aria-hidden />
          </a>
          <form action={logout}>
            <button className={`${row} text-red-600 hover:bg-red-50`}>
              <span className="grid size-9 place-items-center rounded-xl bg-red-50">
                <LogOut className="size-4" aria-hidden />
              </span>
              <span className="flex-1">{d.account.logout}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
