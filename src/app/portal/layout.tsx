import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { getPortalLang } from "@/lib/portal/context";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display-face", display: "swap" });
const body = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Dealer Portal · Tung Lam Food", template: "%s · Tung Lam Dealer Portal" },
  robots: { index: false, follow: false },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
};

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

/** Separate root layout for the dealer portal: app-style, never indexed. */
export default async function PortalRootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getPortalLang();
  return (
    <html lang={lang === "zh" ? "zh-Hans-MY" : lang === "ms" ? "ms-MY" : "en-MY"} className={`${display.variable} ${body.variable}`} data-scroll-behavior="smooth">
      <body className="portal-theme min-h-dvh antialiased">{children}</body>
    </html>
  );
}
