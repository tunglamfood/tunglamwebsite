"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";
import { ChevronDown, Home, Package, ReceiptText, ShoppingCart, UserRound } from "lucide-react";
import { useCart } from "./cart";
import { setPortalLang } from "@/lib/portal/actions";
import { LANG_LABEL, PORTAL_LANGS, type PortalLang } from "@/lib/portal/i18n";

type NavLabels = { home: string; products: string; cart: string; orders: string; account: string };

export function PortalShell({
  children,
  scope,
  lang,
  labels,
  appName,
  dealer,
  canSwitch,
  demo,
}: {
  children: React.ReactNode;
  scope: string;
  lang: PortalLang;
  labels: NavLabels;
  appName: string;
  dealer: string | null;
  canSwitch: boolean;
  demo: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart(scope);
  const [pending, start] = useTransition();

  const nav = [
    { href: "/portal", label: labels.home, icon: Home, exact: true },
    { href: "/portal/products", label: labels.products, icon: Package },
    { href: "/portal/cart", label: labels.cart, icon: ShoppingCart, badge: count },
    { href: "/portal/orders", label: labels.orders, icon: ReceiptText },
    { href: "/portal/account", label: labels.account, icon: UserRound },
  ];
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh pb-20 lg:pb-0">
      {demo && <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-white">{demo}</div>}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16">
          <Link href="/portal" className="flex shrink-0 items-center gap-2">
            <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-8 w-auto sm:h-9" priority />
            <span className="hidden text-sm font-semibold text-ink-soft sm:block">{appName}</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Portal">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={clsx(
                  "relative inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition",
                  isActive(n.href, n.exact) ? "bg-sand text-ink" : "text-ink-soft hover:bg-sand/60 hover:text-ink",
                )}
              >
                <n.icon className="size-4" aria-hidden />
                {n.label}
                {!!n.badge && <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-semibold leading-5 text-white">{n.badge}</span>}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            {dealer && (
              canSwitch ? (
                <Link href="/portal/dealers" className="flex min-w-0 items-center gap-1 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-ink/30">
                  <span className="truncate">{dealer}</span>
                  <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                </Link>
              ) : (
                <span className="hidden truncate rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-soft sm:block">{dealer}</span>
              )
            )}
            <select
              aria-label="Language"
              value={lang}
              disabled={pending}
              onChange={(e) => start(async () => { await setPortalLang(e.target.value); router.refresh(); })}
              className="h-8 shrink-0 rounded-full border border-line bg-white px-2 text-xs font-semibold text-ink-soft"
            >
              {PORTAL_LANGS.map((l) => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:py-8">{children}</main>

      {/* Phone navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Portal">
        <ul className="grid grid-cols-5">
          {nav.map((n) => {
            const on = isActive(n.href, n.exact);
            return (
              <li key={n.href}>
                <Link href={n.href} className={clsx("relative flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-medium", on ? "text-brand" : "text-muted")}>
                  <n.icon className="size-5" aria-hidden />
                  {n.label}
                  {!!n.badge && (
                    <span className="absolute right-[calc(50%-1.35rem)] top-1 min-w-4 rounded-full bg-brand px-1 text-center text-[0.62rem] font-semibold leading-4 text-white">
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
