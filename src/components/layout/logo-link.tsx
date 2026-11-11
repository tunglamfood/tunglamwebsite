"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Home link for the logo. When already on the home page, Next.js treats the click as a
 * no-op navigation and keeps the scroll position — so scroll back to the top explicitly.
 */
export function LogoLink({ href, label, children, className }: { href: string; label: string; children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (pathname === href) {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {children}
    </Link>
  );
}
