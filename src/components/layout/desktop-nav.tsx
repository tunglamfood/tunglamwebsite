"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, BookOpen, ChefHat, ChevronDown } from "lucide-react";
import { isActive, type NavItem } from "./nav";

const ICONS = { recipes: ChefHat, guides: BookOpen };

/** Desktop navigation with hover/keyboard dropdowns. Menus stay in the HTML (crawlable) and fade in when opened. */
export function DesktopNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname() ?? "/";
  // The open menu is tied to the path it was opened on, so navigating closes it.
  const [open, setOpen] = useState<{ key: string; path: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOpen = (key: string) => open?.key === key && open.path === pathname;

  const show = (key: string) => {
    if (timer.current) clearTimeout(timer.current);
    setOpen({ key, path: pathname });
  };
  const hide = (delay = 120) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), delay);
  };

  return (
    <nav aria-label="Main" className="hidden flex-1 items-center justify-center lg:flex">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = isActive(pathname, item.href) || !!item.children?.some((c) => isActive(pathname, c.href));
          const linkClass = clsx(
            "relative inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[0.9375rem] font-medium transition-colors duration-150",
            active ? "text-ink" : "text-ink-soft hover:bg-sand hover:text-ink",
          );
          const marker = active && <span aria-hidden className="absolute inset-x-3 -bottom-[1.05rem] h-0.5 rounded-full bg-brand" />;

          if (!item.children) {
            return (
              <li key={item.href}>
                <Link href={item.href} className={linkClass} aria-current={active ? "page" : undefined}>
                  {item.label}
                  {marker}
                </Link>
              </li>
            );
          }

          const expanded = isOpen(item.href);
          return (
            <li
              key={item.href}
              className="relative"
              onMouseEnter={() => show(item.href)}
              onMouseLeave={() => hide()}
              onFocus={() => show(item.href)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && hide(0)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
            >
              <Link href={item.href} className={clsx(linkClass, expanded && "bg-sand text-ink")} aria-expanded={expanded} aria-haspopup="true">
                {item.label}
                <ChevronDown className={clsx("size-4 text-muted transition-transform duration-200", expanded && "rotate-180")} aria-hidden />
                {marker}
              </Link>

              <div
                className={clsx(
                  "absolute top-full z-50 pt-3 transition duration-200 ease-[var(--ease-out-soft)]",
                  item.menu === "mega" ? "-left-2" : "left-1/2 -translate-x-1/2",
                  expanded ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0",
                )}
              >
                {item.menu === "mega" ? (
                  <div className="menu-panel grid w-[46rem] grid-cols-[1fr_15rem] gap-2 p-2">
                    <ul className="p-1">
                      {item.children.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} className="group/item flex items-center gap-4 rounded-xl p-2.5 transition-colors hover:bg-sand">
                            {c.image && (
                              <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                                <Image src={c.image} alt="" fill sizes="64px" className="object-cover transition duration-500 group-hover/item:scale-110" />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5 font-semibold text-ink">
                                {c.label}
                                <ArrowRight className="size-3.5 -translate-x-1 text-muted opacity-0 transition group-hover/item:translate-x-0 group-hover/item:opacity-100" aria-hidden />
                              </span>
                              {c.description && <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-muted">{c.description}</span>}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {item.all && (
                      <Link href={item.all.href} className="group/all relative flex min-h-56 flex-col justify-end overflow-hidden rounded-xl p-4 text-white">
                        <Image src={item.all.image} alt="" fill sizes="240px" className="object-cover transition duration-700 group-hover/all:scale-105" />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                        <span className="relative flex items-center justify-between gap-2 font-semibold">
                          {item.all.label}
                          <span className="grid size-8 place-items-center rounded-full bg-white text-ink transition group-hover/all:translate-x-0.5">
                            <ArrowRight className="size-4" aria-hidden />
                          </span>
                        </span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <ul className="menu-panel w-[22rem] p-1.5">
                    {item.children.map((c) => {
                      const Icon = c.icon ? ICONS[c.icon] : null;
                      return (
                        <li key={c.href}>
                          <Link href={c.href} className="group/item flex gap-3 rounded-xl p-3 transition-colors hover:bg-sand">
                            {Icon && (
                              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink-soft shadow-[var(--shadow-xs)] transition group-hover/item:text-brand">
                                <Icon className="size-[1.125rem]" aria-hidden />
                              </span>
                            )}
                            <span className="min-w-0">
                              <span className="block font-semibold text-ink">{c.label}</span>
                              {c.description && <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-muted">{c.description}</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
