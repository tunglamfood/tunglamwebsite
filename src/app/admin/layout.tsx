import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Tung Lam Admin" },
  robots: { index: false, follow: false },
};

/** Separate root layout for /admin (no public header/footer, never indexed). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={body.variable}>
      <body className="admin-theme min-h-dvh antialiased">{children}</body>
    </html>
  );
}
