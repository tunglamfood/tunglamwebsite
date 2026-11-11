import { NextResponse, type NextRequest } from "next/server";

/**
 * Locale routing.
 *  - English is served at the root:   /products        -> (rewrite) /en/products
 *  - Other locales are prefixed:       /ms/products, /zh/products
 *  - Explicit /en/... is redirected to the unprefixed URL to avoid duplicate content.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (/^\/(ms|zh)(\/|$)/.test(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, metadata files and anything with a file extension.
  matcher: ["/((?!_next|api|sitemap.xml|robots.txt|llms.txt|manifest.webmanifest|icon|apple-icon|opengraph-image|.*\\..*).*)"],
};
