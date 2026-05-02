# Episteme

Episteme is an alternative to Wikiwand: a fast, clean, typography-first Wikipedia reader.

The goal is simple: make Wikipedia more comfortable to read and explore, while keeping the product **free forever**.

## Please donate to Wikipedia

Episteme exists because Wikipedia exists.

If you can, consider donating to the Wikimedia Foundation:
https://donate.wikimedia.org/

The app includes a small “Support Wikipedia” call-to-action while reading articles (dismissible for a week).

## What’s in this repo

This repository contains the Episteme web app:

- Home + search
- Search results
- Article reader with table of contents + optional infobox sidebar
- File/media pages (Wikimedia “File:” pages) with metadata and a media viewer modal
- “Open from file”: paste or upload a `.txt` containing a Wikipedia title or URL
- Multi-language support (language switcher persisted via cookie/localStorage)
- Multiple reading themes (light, dark, sepia, dim)

## Browser extension

Episteme aims to ship a companion browser extension to “redirect” Wikipedia pages into the Episteme reader (Wikiwand-like flow).

There is currently no extension code in this repository yet (no `manifest.json` / extension build). If the extension lives in a separate repo, link it here.

## How it works (implementation notes)

- Wikipedia fetching is server-side, primarily via the REST HTML endpoint:
  `https://{lang}.wikipedia.org/api/rest_v1/page/html/{title}`
- Fallbacks are implemented for resilience (e.g. MediaWiki `action=parse`).
- HTML is sanitized before rendering to avoid scripts/iframes/event handlers and unsafe URLs.
- Caching uses Next.js caching primitives with revalidation windows (articles ~1h, search ~5m).

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment variables

- `WIKIPEDIA_USER_AGENT` (optional): overrides the default User-Agent used when fetching Wikipedia.

## Docker

```bash
docker build -t episteme .
docker run --rm -p 3000:3000 episteme
```

## Disclaimer

- Episteme is not affiliated with Wikiwand or the Wikimedia Foundation.
- Wikipedia content is provided by Wikipedia contributors and licensed under CC BY-SA (see Wikipedia licensing for details).
- This repository does not currently include an explicit source code license file.
