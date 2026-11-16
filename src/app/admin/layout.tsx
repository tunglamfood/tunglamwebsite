import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Tung Lam Admin" },
  robots: { index: false, follow: false },
};

/** Separate root layout for /admin (no public header/footer, never indexed). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={body.variable} data-scroll-behavior="smooth">
      <body className="admin-theme min-h-dvh antialiased">{children}</body>
    </html>
  );
}
