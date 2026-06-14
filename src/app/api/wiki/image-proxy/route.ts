import { NextRequest, NextResponse } from "next/server";

const USER_AGENT =
  process.env.WIKIPEDIA_USER_AGENT ??
  "EpistemeReader/1.0 (+https://episteme.local)";

function isAllowedWikiHost(hostname: string) {
  const normalized = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized) return false;
  return (
    normalized === "wikipedia.org" ||
    normalized.endsWith(".wikipedia.org") ||
    normalized === "wikimedia.org" ||
    normalized.endsWith(".wikimedia.org") ||
    normalized === "mediawiki.org" ||
    normalized.endsWith(".mediawiki.org")
  );
}

function isAllowedRemoteUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return (
      url.hostname === "maps.wikimedia.org" ||
      url.hostname.endsWith(".wikimedia.org") ||
      url.hostname.endsWith(".wikipedia.org")
    );
  } catch {
    return false;
  }
}

function buildWikimediaMapReferer(remoteUrl: string) {
  try {
    const url = new URL(remoteUrl);
    if (url.hostname !== "maps.wikimedia.org") return null;

    const domain = url.searchParams.get("domain")?.trim().toLowerCase() ?? "";
    const title = url.searchParams.get("title")?.trim() ?? "";
    if (!domain || !isAllowedWikiHost(domain)) {
      return "https://www.wikipedia.org/";
    }

    if (!title) {
      return `https://${domain}/`;
    }

    const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
    return `https://${domain}/wiki/${encodedTitle}`;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const remoteUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!remoteUrl) {
    return NextResponse.json(
      { error: "Missing `url` parameter." },
      { status: 400 }
    );
  }

  if (!isAllowedRemoteUrl(remoteUrl)) {
    return NextResponse.json({ error: "URL not allowed." }, { status: 400 });
  }

  const referer = buildWikimediaMapReferer(remoteUrl);
  const upstreamHeaders = new Headers({
    "User-Agent": USER_AGENT,
    "Api-User-Agent": USER_AGENT,
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  });
  if (referer) {
    upstreamHeaders.set("Referer", referer);
    upstreamHeaders.set("Origin", new URL(referer).origin);
  }

  // IMPORTANT: never use `next: { revalidate }` here. That makes Next buffer and
  // persist every image body to the on-disk Data Cache (.next/cache), which is
  // unbounded and never evicts — it grew to hundreds of GB in production.
  // `no-store` streams images straight through; the `Cache-Control` header below
  // lets Cloudflare cache them at the edge instead of on our disk.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let upstream: Response;
  try {
    upstream = await fetch(remoteUrl, {
      headers: upstreamHeaders,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json(
      { error: "Upstream image fetch failed." },
      { status: 502 }
    );
  }
  clearTimeout(timeout);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Upstream image unavailable." },
      { status: upstream.status || 502 }
    );
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = upstream.headers.get("content-length");

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set(
    "Cache-Control",
    upstream.headers.get("cache-control") ??
      "public, max-age=3600, stale-while-revalidate=86400"
  );
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}
