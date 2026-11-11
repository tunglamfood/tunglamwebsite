import type { NextConfig } from "next";
import legacyRedirects from "./src/data/legacy-redirects.json";

const supabaseHost = new URL(process.env.SUPABASE_URL ?? "https://example.supabase.co").hostname;

const nextConfig: NextConfig = {
  // Classic static generation + ISR (see src/lib/data.ts for revalidation tags).
  cacheComponents: false,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" },
    ],
  },
  async redirects() {
    // 301s from the old NEWPAGES URL structure (tunglamfood.com) to the new clean URLs.
    return legacyRedirects.map((r) => ({ source: r.source, destination: r.destination, permanent: true }));
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
