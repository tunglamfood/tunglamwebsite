import Link from "next/link";
import { ArrowLeftRight, ChevronRight, LogOut, UserRound, Wallet } from "lucide-react";
import { requirePortal, getPortalDict, getPortalLang } from "@/lib/portal/context";
import { getStatement } from "@/lib/portal/data";
import { money, pfmt } from "@/lib/portal/i18n";
import { formatDate } from "@/components/portal/bits";
import { logout } from "@/lib/portal/actions";
import { showPhone } from "@/lib/portal/phone";
import { whatsappLink } from "@/lib/site";
import { PageTitle, pcard } from "@/components/portal/bits";
import { WhatsAppIcon } from "@/components/ui/icons";

export const metadata = { title: "Account" };

export default async function PortalAccount() {
  const [ctx, d, lang] = await Promise.all([requirePortal(), getPortalDict(), getPortalLang()]);
  const c = ctx.customer;
  const statement = c ? await getStatement(c.code) : null;
  // A chain's head office: what each branch owes, side by side.
  const branchBalances = ctx.customers.length > 1
    ? (await Promise.all(ctx.customers.slice(0, 80).map(async (b) => ({ b, st: await getStatement(b.code) }))))
        .filter((x) => x.st && x.st.total !== 0)
    : [];
  const s = d.account;
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
      {branchBalances.length > 0 && (
        <section className={`${pcard} mb-5 overflow-hidden sm:mb-6`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">{s.statement} · {d.orders.allBranches}</h2>
            <p className="font-display text-xl font-bold tabular-nums text-ink">
              {money(branchBalances.reduce((t, x) => t + (x.st?.total ?? 0), 0), ctx.customers[0].currency)}
            </p>
          </div>
          <ul className="divide-y divide-line">
            {branchBalances.map(({ b, st }) => (
              <li key={b.code} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{b.shortName || b.name}</span>
                <span className="text-right">
                  <span className="block font-semibold tabular-nums text-ink">{money(st!.total, b.currency)}</span>
                  {st!.overdue > 0 && <span className="block text-xs font-semibold text-red-600">{pfmt(s.overdueAmount, { amount: money(st!.overdue, b.currency) })}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {c && statement?.asOf && (
        <section className={`${pcard} mb-5 overflow-hidden sm:mb-6`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line p-4 sm:p-5">
            <div>
              <h2 className="font-display text-lg font-bold tracking-[-0.015em] text-ink">{s.statement}</h2>
              <p className="text-sm text-muted">{pfmt(s.asOf, { date: formatDate(statement.asOf, lang) })}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">{money(statement.total, c.currency)}</p>
              {statement.overdue > 0 && <p className="text-sm font-semibold text-red-600">{pfmt(s.overdueAmount, { amount: money(statement.overdue, c.currency) })}</p>}
            </div>
          </div>
          {statement.lines.length === 0 ? (
            <p className="p-5 text-sm text-muted">{s.nothingOwed}</p>
          ) : (
            <ul className="divide-y divide-line">
              {statement.lines.map((l) => (
                <li key={l.docNo} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium tabular-nums text-ink">{l.docNo}</p>
                    <p className="text-xs text-muted">
                      {formatDate(l.docDate, lang)}
                      {l.dueDate ? ` · ${pfmt(s.due, { date: formatDate(l.dueDate, lang) })}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-ink">{money(l.outstanding, c.currency)}</p>
                    {l.daysOverdue > 0 && <p className="text-xs font-semibold text-red-600">{pfmt(s.daysLate, { n: l.daysOverdue })}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line bg-white/40 px-4 py-3 text-xs text-muted sm:px-5">
            {s.statementNote}{" "}
            <Link href="/portal/payments" className="font-semibold text-ink underline underline-offset-2">{d.payments.cta}</Link>
          </div>
        </section>
      )}
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
