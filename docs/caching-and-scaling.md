# Caching & scaling

Episteme serves 100k+ unique visitors/day from a **single Node container behind
Cloudflare**. A few decisions here are deliberate and easy to break by accident —
read this before "optimizing" the caching or fetching code.

## 1. Article pages are cached by Cloudflare, not re-rendered per request

`/wiki/[slug]` must stay **fully determined by its URL** so Cloudflare can cache
one variant per `(slug, lang)`.

- The page reads language **only from `?lang`** — never from `cookies()`. Reading
  a cookie at render time makes the same URL render differently per visitor, which
  poisons a shared CDN cache (visitor A's French page served to visitor B).
- `proxy.ts` (Next 16's renamed Middleware) redirects bare `/wiki/<slug>` URLs to
  `?lang=<cookie|default>`. The redirect is per-visitor (`no-store`); only the
  language-pinned destination is cached.
- **Required Cloudflare Cache Rule** (not in code — configure in the dashboard):
  ```
  (starts_with(http.request.uri.path, "/wiki/")
   and http.request.uri.query contains "lang="
   and not starts_with(http.request.uri.path, "/wiki/search")
   and len(http.request.headers["rsc"]) == 0)
  → Eligible for cache · Edge TTL: Override origin → 1 hour
  ```
  - `query contains "lang="` keeps the per-visitor redirects (no `lang`) out of
    the cache.
  - `len(http.request.headers["rsc"]) == 0` is **critical**. The page renders as a
    dynamic route, so the origin sends `Cache-Control: no-store` and relies on this
    rule's "Override origin" TTL to be cached at all. But "Override origin" also
    ignores the `Vary: rsc` header Next sets. A client-side (soft) navigation
    requests the **same** `?lang=` URL with an `RSC` header and gets a
    `text/x-component` RSC payload back. Without this condition, Cloudflare caches
    that RSC payload under the HTML cache key and then serves raw RSC text
    (`0:{"f":[[[...`) to real browsers. Excluding requests that carry the `rsc`
    header means only true HTML document responses are ever cached.

> ⚠️ Do **not** re-introduce `cookies()`/`headers()` into `/wiki/[slug]`. It flips
> the route to dynamic (`Cache-Control: no-store`) and the CDN stops caching.

## 2. Never persist large/binary fetches to Next's on-disk Data Cache

Next's file cache (`.next/cache`) is **unbounded — it never evicts by size**.
Using `fetch(..., { next: { revalidate } })` on big payloads writes them to disk
forever. In production this grew to **670 GB** and nearly took the server down.

So, deliberately:

- **Image proxy** (`api/wiki/image-proxy`) uses `cache: "no-store"`. Images are
  streamed through and cached by **Cloudflare at the edge** via their
  `Cache-Control` header — never on our disk.
- **Article HTML** (`getArticle`, `getArticleViaParse` in `lib/wikipedia.ts`) uses
  `cache: "no-store"`. The raw Parsoid HTML is 0.5–2 MB/article. The *processed*
  page is still cached by `unstable_cache` (small), so this only refetches on a
  real miss/revalidation.

> ⚠️ Do **not** add `next: { revalidate }` to the image proxy or raw HTML fetches.
> Small JSON fetches (search/preview/file) keeping it is fine.

**Ops safety net** — a host cron prunes cold cache files (they revalidate hourly,
so anything untouched for 2 days is safe to drop):
```
0 3 * * * docker exec <container> find /app/.next/cache -type f -mtime +2 -delete
```

## 3. Stability: every Wikipedia fetch has a timeout

`fetchWithRetries` wraps each attempt in an `AbortController` (12 s). On a single
Node process, one hung upstream connection under load can exhaust the event loop
and take the whole app down. The image proxy has its own 15 s timeout + try/catch.

## 4. Docker uses `output: "standalone"`

`next.config.ts` sets `output: "standalone"`; the Dockerfile runner ships only the
traced runtime (`node server.js`) — no full `node_modules`. Smaller image, faster
cold start, lower RAM. If a runtime dep is ever missing from the trace, add it via
`outputFileTracingIncludes`. The persistent cache volume at `/app/.next/cache`
must be writable by uid 1001 (`nextjs`).
