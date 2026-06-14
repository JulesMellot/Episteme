import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeWikiLanguage, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";

// Article pages are language-dependent. To let Cloudflare cache them correctly
// (one cached variant per language) the language MUST live in the URL, never in
// a cookie read at render time. This proxy normalizes bare article URLs by
// redirecting them to the same path with an explicit `?lang=`, derived from the
// visitor's cookie (or the default language). The destination URL is the only
// thing the CDN caches; the redirect itself is per-visitor and never cached.

// Matches a single article slug: /wiki/<slug> but NOT /wiki/search,
// /wiki/from-file (two segments) or any nested path.
function isArticlePath(pathname: string): boolean {
  if (!/^\/wiki\/[^/]+$/.test(pathname)) return false;
  if (pathname === "/wiki/search") return false;
  return true;
}

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!isArticlePath(pathname)) {
    return NextResponse.next();
  }

  // Already language-pinned: let it flow through so the CDN can cache it.
  if (searchParams.has("lang")) {
    return NextResponse.next();
  }

  const cookieLang = request.cookies.get(WIKI_LANGUAGE_COOKIE_NAME)?.value;
  const lang = normalizeWikiLanguage(cookieLang);

  const url = request.nextUrl.clone();
  url.searchParams.set("lang", lang);

  const response = NextResponse.redirect(url, 307);
  // Per-visitor decision (depends on cookie) — must never be cached by the CDN.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: "/wiki/:path*",
};
