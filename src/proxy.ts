import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin/session";

/**
 * 1. Admin: /admin/** requires a valid session cookie (except /admin/login).
 *    (Pages and server actions re-check the session — this is only the first gate.)
 * 2. Locale routing for the public site:
 *    - English is served at the root:   /products        -> (rewrite) /en/products
 *    - Other locales are prefixed:       /ms/products, /zh/products
 *    - Explicit /en/... is redirected to the unprefixed URL to avoid duplicate content.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const res =
      pathname === "/admin/login" || (await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value))
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/admin/login", request.url));
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

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
