import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";
import { LOCALES, LOCALE_META, hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/i18n";
import { SITE } from "@/lib/site";
import { organizationJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { getCatalog } from "@/lib/data";
import { RevealInit } from "@/components/ui/reveal-init";

const display = Outfit({ subsets: ["latin"], variable: "--font-display-face", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#d71920",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const d = getDictionary(lang);
  return {
    metadataBase: new URL(SITE.url),
    title: { default: d.meta.homeTitle, template: `%s | ${SITE.name}` },
    description: d.meta.homeDescription,
    applicationName: SITE.name,
    authors: [{ name: SITE.legalName }],
    creator: SITE.legalName,
    publisher: SITE.legalName,
    formatDetection: { telephone: true, address: true, email: true },
    category: "food",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
        : undefined,
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const { series } = await getCatalog();

  return (
    <html lang={LOCALE_META[lang].htmlLang} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Enables scroll-reveal styles only when JS runs (content stays visible without it). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <RevealInit />
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {d.nav.skip}
        </a>
        <SiteHeader locale={lang} dict={d} series={series} />
        <main id="main" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <SiteFooter locale={lang} dict={d} series={series} />
        <WhatsAppFab label={d.cta.whatsapp} />
        <JsonLd data={organizationJsonLd(d.meta.orgDescription)} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
