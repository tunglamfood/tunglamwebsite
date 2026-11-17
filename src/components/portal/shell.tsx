"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import { ArrowLeftRight, Check, ChevronDown, Globe, Home, Loader2, Package, ReceiptText, Search, Building2, MapPin, ShoppingCart, Sparkles, UserRound, Wallet } from "lucide-react";
import { useCart } from "./cart";
import { setPortalLang } from "@/lib/portal/actions";
import { LANG_LABEL, PORTAL_LANGS, type PortalLang } from "@/lib/portal/i18n";
import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/ui/icons";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { AssistantIcon } from "./assistant-icon";
import { Toaster } from "./toast";
import { useUnseenUpdates } from "./updates";

const LANG_NAME: Record<PortalLang, string> = { en: "English", ms: "Melayu", zh: "中文" };

/** Compact language dropdown for the phone header (styled, closes on outside tap / Escape). */
function LangMenu({ lang, pending, onChange }: { lang: PortalLang; pending: boolean; onChange: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
        className={clsx(
          "flex h-9 items-center gap-1 rounded-xl border bg-white pl-2 pr-1.5 text-xs font-semibold text-ink-soft shadow-[var(--shadow-xs)] transition-colors",
          open ? "border-ink/20 text-ink" : "border-line",
        )}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Globe className="size-3.5" aria-hidden />}
        {LANG_LABEL[lang]}
        <ChevronDown className={clsx("size-3.5 text-muted transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>
      <ul
        role="menu"
        className={clsx(
          "menu-panel absolute right-0 top-full z-50 mt-2 w-44 origin-top-right p-1.5 transition duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0",
        )}
      >
        {PORTAL_LANGS.map((l) => (
          <li key={l} role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (l !== lang) onChange(l);
              }}
              className={clsx("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-sand", l === lang ? "font-semibold text-ink" : "text-ink-soft")}
            >
              <span className="grid h-6 w-8 place-items-center rounded-md bg-sand text-[0.68rem] font-bold text-ink-soft">{LANG_LABEL[l]}</span>
              <span className="flex-1 text-left">{LANG_NAME[l]}</span>
              {l === lang && <Check className="size-4 text-brand" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ShellLabels = {
  nav: { home: string; products: string; cart: string; orders: string; payments: string; visits: string; branches: string; account: string; assistant: string };
  orderingFor: string;
  switch: string;
  search: string;
  help: string;
  whatsapp: string;
};

export function PortalShell({
  children,
  scope,
  lang,
  labels,
  appName,
  dealer,
  canSwitch,
  updates = [],
  isRep = false,
}: {
  children: React.ReactNode;
  scope: string;
  /** The office's latest change on each recent order — the Orders tab counts the unseen ones. */
  updates?: { orderNo: string; at: string }[];
  /** Sales reps also get Visits. */
  isRep?: boolean;
  lang: PortalLang;
  labels: ShellLabels;
  appName: string;
  dealer: { name: string } | null;
  canSwitch: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart(scope);
  const unseen = useUnseenUpdates(scope, updates);
  const [pending, start] = useTransition();
  const searchRef = useRef<HTMLInputElement>(null);

  const nav = [
    { href: "/portal", label: labels.nav.home, icon: Home, exact: true },
    { href: "/portal/products", label: labels.nav.products, icon: Package },
    { href: "/portal/assistant", label: labels.nav.assistant, icon: Sparkles, ai: true },
    { href: "/portal/cart", label: labels.nav.cart, icon: ShoppingCart, badge: count },
    { href: "/portal/orders", label: labels.nav.orders, icon: ReceiptText, badge: unseen },
    { href: "/portal/payments", label: labels.nav.payments, icon: Wallet },
    ...(canSwitch ? [{ href: "/portal/branches", label: labels.nav.branches, icon: Building2 }] : []),
    ...(isRep ? [{ href: "/portal/visits", label: labels.nav.visits, icon: MapPin }] : []),
    { href: "/portal/account", label: labels.nav.account, icon: UserRound },
  ];
  // Phones: five tabs with the assistant in the middle; Account sits in the header.
  // Payments is reached from Account and from each order on phones.
  const tabs = nav.filter((n) => !["/portal/account", "/portal/payments", "/portal/visits", "/portal/branches"].includes(n.href));
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const changeLang = (l: string) => start(async () => { await setPortalLang(l); router.refresh(); });

  const langSwitch = (
    <div className="glass-inset grid grid-cols-3 gap-1 rounded-xl p-1" role="group" aria-label="Language">
      {PORTAL_LANGS.map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => changeLang(l)}
          aria-pressed={l === lang}
          className={clsx("rounded-lg py-1.5 text-xs font-semibold transition", l === lang ? "bg-white text-ink shadow-[var(--shadow-card)]" : "text-ink-soft hover:text-ink")}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-dvh">
      <ScrollToTop />
      <Toaster />
      
      {/* ------------------------------------------------ Desktop sidebar */}
      <aside className="glass-bar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r lg:flex">
        <Link href="/portal" className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/60 px-5">
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-8 w-auto" priority />
          <span className="rounded-md bg-sand px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">{appName}</span>
        </Link>

        {dealer && (
          <div className="p-3">
            <div className="glass-inset rounded-xl p-3">
              <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted">{labels.orderingFor}</p>
              <p className="mt-1 break-words text-[0.875rem] font-semibold leading-snug text-ink">{dealer.name}</p>
              {canSwitch && (
                <Link href="/portal/dealers" className={clsx("mt-2.5 flex h-8 items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-xs font-semibold text-ink-soft transition-colors hover:border-ink/20 hover:text-ink")}>
                  <ArrowLeftRight className="size-3.5" aria-hidden /> {labels.switch}
                </Link>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Portal">
          {nav.map((n) => {
            const on = isActive(n.href, n.exact);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={on ? "page" : undefined}
                className={clsx(
                  "group flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9rem] font-medium transition-all duration-150",
                  on ? "bg-white/80 font-semibold text-brand-700 shadow-[0_1px_2px_rgb(20_20_20/0.06)]" : "text-ink-soft hover:bg-white/50 hover:text-ink",
                )}
              >
                <n.icon className={clsx("size-[1.125rem] shrink-0", on ? "text-brand" : "text-muted group-hover:text-ink")} aria-hidden />
                <span className="flex-1">{n.label}</span>
                {n.ai && <span className="rounded-md bg-brand px-1.5 py-px text-[0.62rem] font-bold tracking-wide text-white">AI</span>}
                {!!n.badge && (
                  <span className="min-w-5 rounded-full bg-brand px-1.5 text-center text-[0.7rem] font-semibold leading-5 text-white tabular-nums">
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/60 p-3">
          {langSwitch}
          <div className="glass-inset rounded-xl p-3">
            <p className="mb-2 text-xs font-medium text-muted">{labels.help}</p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener"
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1fa855] text-sm font-semibold text-white transition hover:bg-[#1a964b] active:scale-[0.98]"
            >
              <WhatsAppIcon className="size-[1.125rem] shrink-0" /> {labels.whatsapp}
            </a>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* ------------------------------------------------ Top bar */}
        <header className="glass-bar sticky top-0 z-20 border-b">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
            <Link href="/portal" className="flex shrink-0 items-center lg:hidden">
              <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-8 w-auto" priority />
            </Link>

            {/* Desktop: product search (the products page has its own) */}
            {!pathname.startsWith("/portal/products") && (
              <form
                role="search"
                className="relative hidden w-full max-w-md lg:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = searchRef.current?.value.trim();
                  router.push(q ? `/portal/products?q=${encodeURIComponent(q)}` : "/portal/products");
                }}
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input
                  ref={searchRef}
                  placeholder={labels.search}
                  className="h-10 w-full rounded-xl border border-white/70 bg-white/55 pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-ink/20 focus:bg-white focus:ring-4 focus:ring-ink/5"
                />
              </form>
            )}

            <div className="ml-auto flex min-w-0 items-center gap-2">
              {/* Phones: current dealer + switch */}
              {dealer && (
                canSwitch ? (
                  <Link href="/portal/dealers" className="flex min-w-0 items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft lg:hidden">
                    <span className="truncate">{dealer.name}</span>
                    <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                  </Link>
                ) : (
                  <span className="hidden truncate rounded-xl bg-sand px-2.5 py-1.5 text-xs font-semibold text-ink-soft sm:block lg:hidden">{dealer.name}</span>
                )
              )}
              <div className="lg:hidden">
                <LangMenu lang={lang} pending={pending} onChange={changeLang} />
              </div>
              {/* Desktop: cart + account */}
              <Link href="/portal/cart" className="relative hidden h-10 items-center gap-2 rounded-xl border border-white/80 bg-white/70 px-3.5 text-sm font-semibold text-ink transition hover:bg-white lg:inline-flex">
                <ShoppingCart className="size-4" aria-hidden />
                {labels.nav.cart}
                {count > 0 && <span className="min-w-5 rounded-full bg-brand px-1.5 text-center text-[0.7rem] font-semibold leading-5 text-white tabular-nums">{count}</span>}
              </Link>
              {/* Account: a plain profile icon on every screen size */}
              <Link
                href="/portal/account"
                aria-label={labels.nav.account}
                title={labels.nav.account}
                aria-current={isActive("/portal/account") ? "page" : undefined}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-white/80 bg-white/70 text-ink-soft transition hover:bg-white hover:text-ink aria-[current]:border-brand/40 aria-[current]:text-brand lg:size-10"
              >
                <UserRound className="size-[1.125rem]" aria-hidden />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8 lg:pb-16">{children}</main>
      </div>

      {/* ------------------------------------------------ Phone tab bar */}
      <nav className="portal-tabbar glass-bar fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Portal">
        <ul className="grid grid-cols-5">
          {tabs.map((n) => {
            const on = isActive(n.href, n.exact);
            if (n.ai) {
              // Raised centre button for the order assistant.
              return (
                <li key={n.href} className="flex justify-center">
                  <Link href={n.href} aria-current={on ? "page" : undefined} className="relative -mt-6 flex flex-col items-center gap-0.5 pb-2 text-[0.68rem] font-semibold text-brand-700">
                    <span className={clsx("glass grid size-14 place-items-center rounded-full transition-transform duration-200", on && "scale-105")}>
                      <AssistantIcon size={46} />
                    </span>
                    {n.label}
                  </Link>
                </li>
              );
            }
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={on ? "page" : undefined} className={clsx("relative flex flex-col items-center gap-1 pb-2 pt-2 text-[0.68rem] transition-colors", on ? "font-semibold text-brand-700" : "font-medium text-muted")}>
                  <span className={clsx("grid h-7 w-12 place-items-center rounded-full transition-colors duration-200", on ? "bg-brand-50 text-brand" : "")}>
                    <n.icon className="size-[1.125rem]" aria-hidden />
                  </span>
                  {n.label}
                  {!!n.badge && (
                    <span className="absolute right-[calc(50%-1.6rem)] top-1 min-w-4 rounded-full bg-brand px-1 text-center text-[0.62rem] font-semibold leading-4 text-white ring-2 ring-white">
                      {n.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
