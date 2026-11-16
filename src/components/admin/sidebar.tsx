"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  FolderTree,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Newspaper,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { logout, refreshWebsite } from "@/lib/admin/actions";

const GROUPS = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }] },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/brands", label: "Brands", icon: Tag },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/recipes", label: "Recipes & articles", icon: BookOpen },
      { href: "/admin/guides", label: "Guides", icon: Newspaper },
      { href: "/admin/auto-posts", label: "Auto posts", icon: Sparkles },
      { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
    ],
  },
  { label: "Inbox", items: [{ href: "/admin/inquiries", label: "Enquiries", icon: Inbox }] },
];

function SidebarNav({ newInquiries, pathname, onNavigate }: { newInquiries: number; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-8 w-auto" />
        <span className="rounded-md bg-sand px-1.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Admin</span>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted/80">{g.label}</p>
            <ul className="space-y-0.5">
              {g.items.map((n) => {
                const active = "exact" in n && n.exact ? pathname === n.href : pathname.startsWith(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={clsx(
                        "group flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9rem] font-medium transition-all duration-150",
                        active ? "bg-ink text-white shadow-[0_4px_12px_-4px_rgb(0_0_0/0.35)]" : "text-ink-soft hover:bg-sand hover:text-ink",
                      )}
                    >
                      <n.icon className={clsx("size-[1.125rem] shrink-0 transition-colors", active ? "text-white" : "text-muted group-hover:text-ink")} />
                      <span className="flex-1">{n.label}</span>
                      {n.href === "/admin/inquiries" && newInquiries > 0 && (
                        <span className={clsx("rounded-full px-1.5 text-[0.7rem] font-semibold leading-5", active ? "bg-white/20 text-white" : "bg-brand text-white")}>{newInquiries}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="space-y-0.5 border-t border-line p-3">
        <a href="/" target="_blank" rel="noopener" className="flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9rem] font-medium text-ink-soft transition-colors hover:bg-sand hover:text-ink">
          <ExternalLink className="size-[1.125rem] text-muted" /> View website
        </a>
        <form action={logout}>
          <button className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[0.9rem] font-medium text-red-600 transition-colors hover:bg-red-50">
            <LogOut className="size-[1.125rem]" /> Log out
          </button>
        </form>
      </div>
    </nav>
  );
}

/** Dropdown menu under the account button. */
function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
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

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={clsx("flex h-10 items-center gap-2 rounded-xl border bg-white py-1 pl-1 pr-2 transition-colors hover:border-zinc-300", open ? "border-zinc-300" : "border-line")}
      >
        <span className="grid size-8 place-items-center rounded-lg bg-brand text-xs font-bold text-white">TL</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[0.8125rem] font-semibold text-ink">Admin</span>
          <span className="block text-[0.7rem] text-muted">tunglamfood.my</span>
        </span>
        <ChevronDown className={clsx("size-4 text-muted transition-transform duration-200", open && "rotate-180")} />
      </button>
      <div
        role="menu"
        className={clsx(
          "absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-xl bg-white p-1.5 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_12px_32px_-8px_rgb(0_0_0/0.2)] transition duration-150 ease-out",
          open ? "visible scale-100 opacity-100" : "pointer-events-none invisible scale-95 opacity-0",
        )}
      >
        <div className="mb-1 border-b border-line px-2.5 pb-2.5 pt-1.5">
          <p className="text-sm font-semibold text-ink">Tung Lam Admin</p>
          <p className="text-xs text-muted">Website content</p>
        </div>
        <a href="/" target="_blank" rel="noopener" role="menuitem" className={item}>
          <ExternalLink className="size-4 text-muted" /> View website
        </a>
        <button
          type="button"
          role="menuitem"
          className={item}
          title="Saving content already updates the website. Use this after editing data directly in Supabase."
          onClick={() =>
            start(async () => {
              await refreshWebsite();
              setDone(true);
              setTimeout(() => setDone(false), 2000);
            })
          }
        >
          {pending ? <Loader2 className="size-4 animate-spin text-muted" /> : done ? <Check className="size-4 text-emerald-600" /> : <RefreshCw className="size-4 text-muted" />}
          Refresh website cache
        </button>
        <form action={logout} className="mt-1 border-t border-line pt-1">
          <button role="menuitem" className={clsx(item, "text-red-600 hover:bg-red-50 hover:text-red-700")}>
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </div>
    </div>
  );
}

/** Search box in the top bar; press "/" anywhere to focus it. */
function TopSearch() {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      role="search"
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(e) => {
        e.preventDefault();
        const q = ref.current?.value.trim();
        if (q) router.push(`/admin/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        name="q"
        placeholder="Search products, recipes, guides…"
        className="h-10 w-full rounded-xl border border-transparent bg-sand pl-9 pr-10 text-sm text-ink outline-none transition placeholder:text-muted focus:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-ink/5"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-line bg-white px-1.5 text-[0.7rem] font-medium text-muted">/</kbd>
    </form>
  );
}

/** Admin frame: fixed sidebar on desktop, slide-in drawer on phones, sticky top bar. */
export function AdminShell({ newInquiries, children }: { newInquiries: number; children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  // Drawer state is tied to the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-white lg:block">
        <SidebarNav newInquiries={newInquiries} pathname={pathname} />
      </aside>

      {/* Phone drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpenOn(null)} />
          <div className="absolute inset-y-0 left-0 w-[17rem] animate-drawer-left bg-white shadow-2xl">
            <button type="button" onClick={() => setOpenOn(null)} className={clsx(iconBtn, "absolute right-3 top-4 z-10")} aria-label="Close menu">
              <X className="size-4" />
            </button>
            <SidebarNav newInquiries={newInquiries} pathname={pathname} onNavigate={() => setOpenOn(null)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-xl sm:px-8 lg:h-16">
          <button type="button" onClick={() => setOpenOn(pathname)} className={clsx(iconBtn, "border border-line lg:hidden")} aria-label="Open menu">
            <Menu className="size-4" />
          </button>
          <Image src="/brand/logo.webp" alt="Tung Lam" width={299} height={171} className="h-7 w-auto lg:hidden" />
          <TopSearch />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/admin/search" className={clsx(iconBtn, "border border-line md:hidden")} aria-label="Search">
              <Search className="size-4" />
            </Link>
            <AccountMenu />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8 sm:pt-8">{children}</main>
      </div>
    </>
  );
}

const iconBtn = "grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink-soft transition-colors hover:bg-sand hover:text-ink";
