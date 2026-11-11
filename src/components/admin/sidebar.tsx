"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { BookOpen, ExternalLink, FolderTree, HelpCircle, Inbox, LayoutDashboard, LogOut, Menu, Package, Tag, X } from "lucide-react";
import { logout } from "@/lib/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/brands", label: "Brands", icon: Tag },
  { href: "/admin/recipes", label: "Recipes & articles", icon: BookOpen },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/inquiries", label: "Enquiries", icon: Inbox },
];

export function AdminSidebar({ newInquiries }: { newInquiries: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-5">
        <span className="grid size-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">TL</span>
        <span className="text-sm font-semibold text-ink">Tung Lam Admin</span>
      </div>
      <ul className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex h-9 items-center gap-3 rounded-md px-3 text-sm transition",
                  active ? "bg-white font-semibold text-ink shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-line" : "text-ink-soft hover:bg-white/70 hover:text-ink",
                )}
              >
                <n.icon className="size-4 shrink-0" />
                <span className="flex-1">{n.label}</span>
                {n.href === "/admin/inquiries" && newInquiries > 0 && (
                  <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-semibold leading-5 text-white">{newInquiries}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="space-y-0.5 border-t border-line px-3 py-3">
        <a href="/" target="_blank" rel="noopener" className="flex h-9 items-center gap-3 rounded-md px-3 text-sm text-ink-soft hover:bg-white/70 hover:text-ink">
          <ExternalLink className="size-4" /> View website
        </a>
        <form action={logout}>
          <button className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-soft hover:bg-white/70 hover:text-ink">
            <LogOut className="size-4" /> Log out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-cream lg:block">{nav}</aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-cream/95 px-4 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">TL</span>
          <span className="text-sm font-semibold">Tung Lam Admin</span>
        </span>
        <button type="button" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-md border border-line bg-white" aria-label="Open menu">
          <Menu className="size-4" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 bg-cream shadow-xl">
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-md text-muted" aria-label="Close menu">
              <X className="size-4" />
            </button>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
