# Episteme

Episteme is an alternative to Wikiwand: a fast, clean, typography-first Wikipedia reader.

The goal is simple: make Wikipedia more comfortable to read and explore, while keeping the product **free forever**.

## Public instance

You can use Episteme right now on the public instance:
https://episteme.tllm.fr/

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

The extension will support self-hosted instances (custom base URL), so you can use your own Episteme server instead of a public one.

Extension repository:
https://github.com/JulesMellot/episteme_extension

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

## Built with AI

This project was built with the help of AI tools/models:

- Codex 5.3
- Gemini Pro 3.1
- Kimi K2.6
- MiniMax 2.7

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

## Self-hosting

Episteme can be self-hosted: anyone can run their own instance and keep full control over deployment.

### Self-host with Docker

Build the image:

```bash
docker build -t episteme .
```

Run the container:

```bash
docker run -d --name episteme -p 3000:3000 episteme
```

Open http://localhost:3000

Optional: set a custom Wikipedia User-Agent:

```bash
docker run -d --name episteme -p 3000:3000 -e WIKIPEDIA_USER_AGENT="EpistemeReader/1.0 (+https://your-domain.example)" episteme
```

Once hosted, you can point the browser extension to your instance (custom base URL).

## Disclaimer

- Episteme is not affiliated with Wikiwand or the Wikimedia Foundation.
- Wikipedia content is provided by Wikipedia contributors and licensed under CC BY-SA (see Wikipedia licensing for details).
- This repository does not currently include an explicit source code license file.
