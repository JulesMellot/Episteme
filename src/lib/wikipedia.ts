import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import { unstable_cache } from "next/cache";
import { normalizeWikiLanguage } from "@/lib/wiki-language";

export interface TocItem {
  id: string;
  level: number;
  text: string;
}

export interface WikipediaArticle {
  title: string;
  summary: string | null;
  html: string;
  infoboxHtml: string | null;
  toc: TocItem[];
}

export interface WikipediaFile {
  kind: "file";
  title: string;
  summary: string | null;
  fileUrl: string;
  thumbUrl: string | null;
  mime: string | null;
  width: number | null;
  height: number | null;
  descriptionHtml: string | null;
  licenseHtml: string | null;
}

export type WikipediaPage =
  | ({ kind: "article" } & WikipediaArticle)
  | WikipediaFile;

export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

export interface WikipediaTrendingTopic {
  title: string;
  views: number;
}

const USER_AGENT = process.env.WIKIPEDIA_USER_AGENT ?? "EpistemeReader/1.0 (+https://episteme.local)";
const ARTICLE_REVALIDATE_SECONDS = 3600;
const SEARCH_REVALIDATE_SECONDS = 300;
const TRENDING_REVALIDATE_SECONDS = 1800;
const DEFAULT_RETRIES = 2;
const INTERLANGUAGE_SOURCE_CANDIDATES = ["fr", "en", "es", "de", "it", "pt", "ja", "zh", "ar", "ru"] as const;
const BLOCKED_SELECTOR = "script, style, iframe, frame, object, embed, form, link[rel='stylesheet'], meta[http-equiv='refresh']";
const STRIPPED_ATTRS = new Set([
  "about",
  "data-mw",
  "data-parsoid",
  "prefix",
  "property",
  "resource",
  "srcdoc",
  "typeof",
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetries(
  input: string | URL,
  init: RequestInit,
  {
    retries = 2,
    retryStatuses = [429, 500, 502, 503, 504],
  }: {
    retries?: number;
    retryStatuses?: number[];
  } = {}
): Promise<Response | null> {
  let lastResponse: Response | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(input, init);
      lastResponse = res;

      if (res.ok || res.status === 404) {
        return res;
      }

      if (retryStatuses.includes(res.status) && i < retries) {
        await sleep(500 * (i + 1));
        continue;
      }

      return res;
    } catch {
      if (i < retries) {
        await sleep(500 * (i + 1));
        continue;
      }
      return lastResponse;
    }
  }

  return lastResponse;
}

function wikipediaApiBase(language?: string) {
  const lang = normalizeWikiLanguage(language);
  return `https://${lang}.wikipedia.org`;
}

function normalizeSlug(slug: string) {
  return decodeURIComponent(slug).replace(/_/g, " ").trim();
}

function isWikimediaMapUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  const absolute = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  try {
    const parsed = new URL(absolute);
    return parsed.hostname === "maps.wikimedia.org";
  } catch {
    return false;
  }
}

function toMapProxyUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const absolute = trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  if (!isWikimediaMapUrl(absolute)) return null;
  return `/api/wiki/image-proxy?url=${encodeURIComponent(absolute)}`;
}

function isFileSlug(slug: string) {
  return /^(file|image|fichier):/i.test(normalizeSlug(slug));
}

function stripScriptTags(input: string) {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "");
}

function isSafeUrl(value: string, attributeName: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text/html")
  ) {
    return false;
  }

  if (
    trimmed.startsWith("#") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("//")
  ) {
    return true;
  }

  try {
    const protocol = new URL(trimmed).protocol;
    if (attributeName === "href") {
      return protocol === "http:" || protocol === "https:" || protocol === "mailto:" || protocol === "tel:";
    }

    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizeStyleValue(value: string) {
  const style = value.trim();
  if (!style) return "";

  const lowered = style.toLowerCase();
  if (
    lowered.includes("expression(") ||
    lowered.includes("@import") ||
    lowered.includes("javascript:") ||
    lowered.includes("vbscript:") ||
    lowered.includes("data:text/html")
  ) {
    return "";
  }

  return style;
}

function sanitizeHtmlFragment(input: string) {
  const $ = cheerio.load(`<body>${stripScriptTags(input)}</body>`);
  const $body = $("body");

  $body.find(BLOCKED_SELECTOR).remove();
  $body.find("*").each((_, el) => {
    const attribs = { ...(el.attribs ?? {}) };

    for (const [name, value] of Object.entries(attribs)) {
      const lowerName = name.toLowerCase();
      const normalizedValue = typeof value === "string" ? value : "";

      if (
        lowerName.startsWith("on") ||
        lowerName.startsWith("data-") ||
        STRIPPED_ATTRS.has(lowerName)
      ) {
        $(el).removeAttr(name);
        continue;
      }

      if (lowerName === "style") {
        const safeStyle = sanitizeStyleValue(normalizedValue);
        if (!safeStyle) {
          $(el).removeAttr(name);
        } else {
          $(el).attr("style", safeStyle);
        }
        continue;
      }

      if ((lowerName === "href" || lowerName === "src" || lowerName === "xlink:href") && !isSafeUrl(normalizedValue, lowerName === "href" ? "href" : "src")) {
        $(el).removeAttr(name);
      }
    }
  });

  return $body.html() ?? "";
}

function normalizeFileTitle(title: string) {
  const normalized = title.trim();
  if (/^fichier:/i.test(normalized)) {
    return `File:${normalized.slice("Fichier:".length)}`;
  }
  if (/^image:/i.test(normalized)) {
    return `File:${normalized.slice("Image:".length)}`;
  }
  return normalized;
}

interface WikipediaLanguageLink {
  code?: string;
  key?: string;
  title?: string;
}

async function resolveInterlanguageTitle(
  slug: string,
  {
    targetLanguage,
    retries = DEFAULT_RETRIES,
  }: {
    targetLanguage: string;
    retries?: number;
  }
): Promise<string | null> {
  const normalizedTarget = normalizeWikiLanguage(targetLanguage);
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) return null;

  const sourceCandidates = Array.from(
    new Set([normalizedTarget, ...INTERLANGUAGE_SOURCE_CANDIDATES])
  );

  for (const sourceLanguage of sourceCandidates) {
    const url = new URL(
      `${wikipediaApiBase(sourceLanguage)}/w/rest.php/v1/page/${encodeURIComponent(normalizedSlug)}/links/language`
    );

    const res = await fetchWithRetries(
      url,
      {
        cache: "force-cache",
        headers: {
          "User-Agent": USER_AGENT,
          "Api-User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
        next: {
          revalidate: ARTICLE_REVALIDATE_SECONDS,
          tags: ["wikipedia-langlinks"],
        },
      },
      { retries }
    );

    if (!res || !res.ok) {
      continue;
    }

    let data: WikipediaLanguageLink[] | null = null;
    try {
      data = (await res.json()) as WikipediaLanguageLink[];
    } catch {
      continue;
    }

    if (!Array.isArray(data)) {
      continue;
    }

    const targetMatch = data.find(
      (entry) =>
        normalizeWikiLanguage(typeof entry?.code === "string" ? entry.code : undefined) ===
        normalizedTarget
    );
    const title =
      (typeof targetMatch?.key === "string" && targetMatch.key.trim()) ||
      (typeof targetMatch?.title === "string" && targetMatch.title.trim()) ||
      "";

    if (title) {
      return title.replace(/_/g, " ").trim();
    }
  }

  return null;
}

async function getPageUncached(slug: string, retries = DEFAULT_RETRIES, language?: string): Promise<WikipediaPage | null> {
  if (isFileSlug(slug)) {
    const file = await getFile(slug, retries, language);
    return file;
  }

  const article = await getArticle(slug, retries, language);
  if (article) return { kind: "article", ...article };

  const normalizedLanguage = normalizeWikiLanguage(language);
  const translatedTitle = await resolveInterlanguageTitle(slug, {
    targetLanguage: normalizedLanguage,
    retries,
  });
  if (translatedTitle) {
    const translated = await getArticle(translatedTitle, retries, normalizedLanguage);
    if (translated) return { kind: "article", ...translated };
  }

  // If interlanguage links do not resolve, try local search in target language.
  const guessQuery = normalizeSlug(slug);
  const candidates = await searchWikipedia(guessQuery, {
    limit: 1,
    retries,
    language: normalizedLanguage,
  });
  const bestTitle = candidates[0]?.title;
  if (bestTitle) {
    const translated = await getArticle(bestTitle, retries, normalizedLanguage);
    if (translated) return { kind: "article", ...translated };
  }

  return null;
}

const getCachedPage = unstable_cache(
  async (slug: string, language: string) => getPageUncached(slug, DEFAULT_RETRIES, language),
  ["wikipedia-page-v7"],
  {
    revalidate: ARTICLE_REVALIDATE_SECONDS,
    tags: ["wikipedia-page"],
  }
);

export async function getPage(slug: string, retries = DEFAULT_RETRIES, language?: string): Promise<WikipediaPage | null> {
  if (retries !== DEFAULT_RETRIES) {
    return getPageUncached(slug, retries, language);
  }

  return getCachedPage(slug, normalizeWikiLanguage(language));
}

export async function getFile(slug: string, retries = 2, language?: string): Promise<WikipediaFile | null> {
  const title = normalizeFileTitle(normalizeSlug(slug));

  const restTitle = encodeURIComponent(title).replace(/%3A/gi, ":");
  const coreRestUrl = new URL(`${wikipediaApiBase(language)}/w/rest.php/v1/file/${restTitle}`);

  const res = await fetchWithRetries(
    coreRestUrl,
    {
      cache: "force-cache",
      headers: {
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      next: {
        revalidate: ARTICLE_REVALIDATE_SECONDS,
        tags: ["wikipedia-file"],
      },
    },
    { retries }
  );

  if (!res || !res.ok) {
    if (res?.status === 404) return null;
    return null;
  }

  const core = (await res.json()) as {
    title?: string;
    file_description_url?: string;
    preferred?: { url?: string; width?: number; height?: number };
    thumbnail?: { url?: string; width?: number; height?: number };
    original?: { url?: string; width?: number; height?: number };
  };

  const fileUrl = core.original?.url;
  if (!fileUrl) return null;

  const thumbUrl = core.preferred?.url ?? core.thumbnail?.url ?? null;

  const descriptionUrl = core.file_description_url ? `https:${core.file_description_url}` : null;
  const fileTitleFromDesc =
    descriptionUrl && descriptionUrl.includes("/wiki/") ? decodeURIComponent(descriptionUrl.split("/wiki/")[1] ?? "") : "";
  const canonicalTitle = fileTitleFromDesc ? fileTitleFromDesc.replace(/_/g, " ").trim() : title;

  let descriptionHtml: string | null = null;
  let licenseHtml: string | null = null;
  let summary: string | null = null;
  let mime: string | null = null;

  if (descriptionUrl) {
    const host = new URL(descriptionUrl).hostname;
    const actionUrl = new URL(`https://${host}/w/api.php`);
    actionUrl.searchParams.set("action", "query");
    actionUrl.searchParams.set("titles", canonicalTitle);
    actionUrl.searchParams.set("prop", "imageinfo");
    actionUrl.searchParams.set("iiprop", "extmetadata");
    actionUrl.searchParams.set("redirects", "1");
    actionUrl.searchParams.set("format", "json");
    actionUrl.searchParams.set("formatversion", "2");

    const metaRes = await fetchWithRetries(
      actionUrl,
      {
        cache: "force-cache",
        headers: {
          "User-Agent": USER_AGENT,
          "Api-User-Agent": USER_AGENT,
          "Accept": "application/json",
        },
        next: {
          revalidate: ARTICLE_REVALIDATE_SECONDS,
          tags: ["wikipedia-file-metadata"],
        },
      },
      { retries }
    );

    if (metaRes && metaRes.ok) {
      const meta = (await metaRes.json()) as {
        query?: {
          pages?: Array<{
            title: string;
            missing?: boolean;
            imageinfo?: Array<{
              mime?: string;
              extmetadata?: Record<string, { value?: string }>;
            }>;
          }>;
        };
      };

      const page = meta.query?.pages?.[0];
      const info = page?.missing ? null : page?.imageinfo?.[0];
      const ext = info?.extmetadata ?? {};
      mime = info?.mime ?? null;

      if (ext.ImageDescription?.value) {
        descriptionHtml = sanitizeHtmlFragment(ext.ImageDescription.value);
        const text = ext.ImageDescription.value
          .replace(/<[^>]*>/g, "")
          .replace(/\s+/g, " ")
          .trim();
        summary = text ? text : null;
      }

      if (ext.LicenseShortName?.value) {
        licenseHtml = sanitizeHtmlFragment(ext.LicenseShortName.value);
      }
    }
  }

  return {
    kind: "file",
    title: canonicalTitle || title,
    summary,
    fileUrl,
    thumbUrl,
    mime,
    width: typeof core.original?.width === "number" ? core.original.width : null,
    height: typeof core.original?.height === "number" ? core.original.height : null,
    descriptionHtml,
    licenseHtml,
  };
}

export async function getArticle(slug: string, retries = 2, language?: string): Promise<WikipediaArticle | null> {
  const url = `${wikipediaApiBase(language)}/api/rest_v1/page/html/${encodeURIComponent(slug)}`;
  const res = await fetchWithRetries(
    url,
    {
      cache: "force-cache",
      headers: {
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
        "Accept": "text/html; charset=utf-8; profile=\"https://www.mediawiki.org/wiki/Specs/HTML/2.8.0\"",
      },
      next: {
        revalidate: ARTICLE_REVALIDATE_SECONDS,
        tags: ["wikipedia-article"],
      },
    },
    { retries }
  );

  if (res?.ok) {
    const rawHtml = await res.text();
    return parseWikipediaHtml(slug, rawHtml);
  }

  if (res?.status === 404) return null;

  // REST endpoint can intermittently return 403/5xx. Fall back to MediaWiki parse API.
  const fallback = await getArticleViaParse(slug, retries, language);
  if (fallback) return fallback;
  return null;
}

async function getArticleViaParse(slug: string, retries = 2, language?: string): Promise<WikipediaArticle | null> {
  const title = normalizeSlug(slug);
  if (!title) return null;

  const url = new URL(`${wikipediaApiBase(language)}/w/api.php`);
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", title);
  url.searchParams.set("prop", "text");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await fetchWithRetries(
    url,
    {
      cache: "force-cache",
      headers: {
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      next: {
        revalidate: ARTICLE_REVALIDATE_SECONDS,
        tags: ["wikipedia-article-fallback"],
      },
    },
    { retries }
  );

  if (!res || !res.ok) {
    if (res?.status === 404) return null;
    return null;
  }

  let data: {
    error?: { info?: string };
    parse?: { title?: string; text?: string };
  } | null = null;
  try {
    data = (await res.json()) as {
      error?: { info?: string };
      parse?: { title?: string; text?: string };
    };
  } catch {
    return null;
  }

  if (!data?.parse?.text) return null;

  const wrapped = `<html><head><title>${escapeHtml(
    data.parse.title ?? title
  )}</title></head><body>${data.parse.text}</body></html>`;

  return parseWikipediaHtml(slug, wrapped);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function appendStyle($el: cheerio.Cheerio<Element>, style: string) {
  const current = ($el.attr("style") ?? "").trim();
  const suffix = current && !current.endsWith(";") ? ";" : "";
  $el.attr("style", `${current}${suffix}${style}`);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanCollapsibleLabel(value: string) {
  const cleaned = normalizeWhitespace(
    value
      .replace(/\[\s*(show|hide|expand|collapse)\s*\]/gi, "")
      .replace(/\b(show|hide|expand|collapse)\b/gi, "")
  );
  return cleaned;
}

function getCollapsibleTitle($root: cheerio.Cheerio<Element>) {
  const candidates = [
    $root.children("caption").first(),
    $root.find("> caption").first(),
    $root.find("> tbody > tr:first-child > th").first(),
    $root.find("> tr:first-child > th").first(),
    $root.find("> .mw-collapsible-toggle").first(),
    $root.find(".mw-collapsible-toggle").first(),
    $root.find("> h2, > h3, > h4, > h5, > h6").first(),
    $root.find("h2, h3, h4, h5, h6").first(),
  ];

  for (const candidate of candidates) {
    if (!candidate?.length) continue;
    const clone = candidate.clone();
    clone.find(".mw-collapsible-toggle").remove();
    const text = cleanCollapsibleLabel(clone.text());
    if (text && text.length >= 3) {
      return text;
    }
  }

  const ariaLabel = cleanCollapsibleLabel($root.attr("aria-label") ?? "");
  if (ariaLabel) return ariaLabel;

  return "Details";
}

function enhanceWikipediaGalleries($: cheerio.CheerioAPI) {
  $(".gallery").each((_, gallery) => {
    const $gallery = $(gallery);
    $gallery.addClass("wiki-gallery");
    $gallery.removeAttr("style");

    $gallery.find(".gallerybox").each((__, item) => {
      const $item = $(item);
      $item.addClass("wiki-gallery-item");
      $item.removeAttr("style");
    });

    $gallery.find(".thumb, .thumbinner").each((__, block) => {
      const $block = $(block);
      $block.addClass("wiki-gallery-thumb");
      $block.removeAttr("style");
    });

    $gallery.find(".gallerytext").each((__, caption) => {
      $(caption).addClass("wiki-gallery-caption");
    });

    $gallery.find("li").each((__, item) => {
      $(item).removeAttr("style");
    });

    $gallery.find("img").each((__, img) => {
      $(img).addClass("wiki-gallery-image");
    });
  });
}

function enhanceCollapsibles($: cheerio.CheerioAPI) {
  $(".mw-collapsible").each((_, root) => {
    const $root = $(root);
    if ($root.closest(".wiki-collapsible").length > 0) return;

    const isCollapsed = $root.hasClass("mw-collapsed");
    const title = getCollapsibleTitle($root);
    const openAttr = isCollapsed ? "" : " open";

    if ($root.is("table")) {
      const $table = $root.clone();
      $table.removeClass("mw-collapsible mw-collapsed");
      $table.find(".mw-collapsible-toggle").remove();

      const markup = `<details class="wiki-collapsible wiki-collapsible--table"${openAttr}>
        <summary class="wiki-collapsible__summary">${escapeHtml(title)}</summary>
        <div class="wiki-collapsible__body">${$.html($table)}</div>
      </details>`;
      $root.replaceWith(markup);
      return;
    }

    const $content = $root.clone();
    $content.removeClass("mw-collapsible mw-collapsed");
    $content.find(".mw-collapsible-toggle").remove();

    const innerHtml = ($content.html() ?? "").trim();
    if (!innerHtml) return;

    const markup = `<details class="wiki-collapsible"${openAttr}>
      <summary class="wiki-collapsible__summary">${escapeHtml(title)}</summary>
      <div class="wiki-collapsible__body">${innerHtml}</div>
    </details>`;
    $root.replaceWith(markup);
  });
}

function ensureComplexModuleFallback(
  $el: cheerio.Cheerio<Element>,
  message: string,
  $: cheerio.CheerioAPI
) {
  const hasVisibleContent =
    $el.find("img, svg, canvas, table, pre, code, audio, video").length > 0 ||
    normalizeWhitespace($el.text()).length > 0;

  if (hasVisibleContent) return;

  $el.empty().append(
    $(
      `<p class="wiki-module__fallback">${escapeHtml(message)}</p>`
    )
  );
}

function enhanceComplexModules($: cheerio.CheerioAPI) {
  $(".mw-highlight, pre.sourceCode, div.sourceCode").each((_, block) => {
    const $block = $(block);
    $block.addClass("wiki-module wiki-module--code");
    $block.find("pre").addClass("wiki-code-block");
    $block.find("code").addClass("wiki-inline-code");
  });

  $(".timeline-wrapper, .timeline").each((_, block) => {
    const $block = $(block);
    $block.addClass("wiki-module wiki-module--timeline");
    ensureComplexModuleFallback($block, "Timeline preview unavailable in this reader.", $);
  });

  $(".mw-ext-score, .score").each((_, block) => {
    const $block = $(block);
    $block.addClass("wiki-module wiki-module--score");
    ensureComplexModuleFallback($block, "Score preview unavailable in this reader.", $);
  });

  $(".mw-graph, .chart, .graph-container, .vega-embed").each((_, block) => {
    const $block = $(block);
    $block.addClass("wiki-module wiki-module--chart");
    ensureComplexModuleFallback($block, "Interactive chart unavailable in this reader.", $);
  });

  $(".chemf, .chem2-inline, .chem2-su, .chem2-sub").each((_, block) => {
    $(block).addClass("wiki-module wiki-module--chem");
  });
}

function enhanceMediaElements($: cheerio.CheerioAPI) {
  $("audio, video").each((_, media) => {
    const $media = $(media);
    $media.addClass("wiki-inline-media");

    if (!$media.attr("controls")) {
      $media.attr("controls", "");
    }
    if (!$media.attr("preload")) {
      $media.attr("preload", "metadata");
    }
    if ($media.is("video") && !$media.attr("playsinline")) {
      $media.attr("playsinline", "");
    }

    const $card = $media
      .closest("figure, .thumb, .thumbinner, .audio-container, .video-container, .mw-tmh-player")
      .first();
    if ($card.length > 0) {
      $card.addClass("wiki-media-card");
    }
  });

  $(".mw-tmh-player, .thumb .video-container, .thumb .audio-container").each((_, block) => {
    $(block).addClass("wiki-media-card");
  });
}

function parseWikipediaHtml(slug: string, rawHtml: string): WikipediaArticle {
  const $ = cheerio.load(rawHtml);

  // Clean HTML with Cheerio first for structural changes
  $('script, style, link[rel="stylesheet"]').remove();
  $('.mw-editsection, .noprint, .metadata, .ambox').remove();
  
  // Aggressively remove Wikipedia-specific sidebars, navboxes, and empty elements that break the UX
  $('.navbox, .vertical-navbox, table.sidebar, .sistersitebox, .mw-empty-elt').remove();

  enhanceWikipediaGalleries($);
  enhanceCollapsibles($);
  enhanceComplexModules($);
  enhanceMediaElements($);

  // Extract TOC
  const toc: TocItem[] = [];
  $('h2, h3').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text) return;
    
    let id = $el.attr('id');
    if (!id) {
      id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      $el.attr('id', id);
    }

    const level = el.tagName.toLowerCase() === 'h2' ? 2 : 3;
    toc.push({ id, level, text });
  });

  // Extract Infobox BEFORE extracting the rest of the HTML
  let infoboxHtml: string | null = null;
  const infoboxSelector = ".infobox, .taxobox";
  const $topLevelInfoboxes = $(infoboxSelector).filter((_, el) => $(el).parents(infoboxSelector).length === 0);
  if ($topLevelInfoboxes.length > 0) {
    $topLevelInfoboxes.each((_, el) => {
      const $infobox = $(el);

      // ----------------------------------------------------
      // Bento Box Generator for multiple hero images
      // ----------------------------------------------------
      const $rows = $infobox.find("tr");
      let galleryRowIndex = -1;
      let galleryImages: string[] = [];

      $rows.each((rowIndex, tr) => {
        const $tr = $(tr);
        if ($tr.find("th").length > 0) return;

        const $imgs = $tr
          .find("img")
          .filter((__, img) => parseInt($(img).attr("width") || "0", 10) >= 80);

        // Only transform true gallery rows (2+ images in the same row),
        // so maps/flags single-image rows are left untouched.
        if ($imgs.length >= 2) {
          galleryImages = $imgs
            .map((__, img) => $(img).attr("src") ?? "")
            .get()
            .filter(Boolean);
          galleryRowIndex = rowIndex;
          return false;
        }
      });

      if (galleryRowIndex >= 0 && galleryImages.length >= 2) {
        const images = Array.from(new Set(galleryImages)).slice(0, 5);
        let bentoHtml = "";

        if (images.length === 2) {
          bentoHtml = `<div class="bento-image-grid grid grid-cols-2 gap-1.5 aspect-[2/1]">
            ${images.map((src) => `<div class="relative w-full h-full overflow-hidden"><img src="${src}" class="w-full h-full object-cover" /></div>`).join("")}
          </div>`;
        } else if (images.length === 3) {
          bentoHtml = `<div class="bento-image-grid grid grid-cols-2 grid-rows-2 gap-1.5 aspect-[4/3]">
            <div class="relative col-span-1 row-span-2 w-full h-full overflow-hidden"><img src="${images[0]}" class="w-full h-full object-cover" /></div>
            <div class="relative col-span-1 row-span-1 w-full h-full overflow-hidden"><img src="${images[1]}" class="w-full h-full object-cover" /></div>
            <div class="relative col-span-1 row-span-1 w-full h-full overflow-hidden"><img src="${images[2]}" class="w-full h-full object-cover" /></div>
          </div>`;
        } else if (images.length === 4) {
          bentoHtml = `<div class="bento-image-grid grid grid-cols-2 grid-rows-2 gap-1.5 aspect-square">
            ${images.map((src) => `<div class="relative col-span-1 row-span-1 w-full h-full overflow-hidden"><img src="${src}" class="w-full h-full object-cover" /></div>`).join("")}
          </div>`;
        } else {
          const top = images.slice(0, 2);
          const bottom = images.slice(2, 5);
          bentoHtml = `<div class="bento-image-grid grid grid-cols-6 grid-rows-2 gap-1.5 aspect-[4/3]">
            ${top.map((src) => `<div class="relative col-span-3 row-span-1 w-full h-full overflow-hidden"><img src="${src}" class="w-full h-full object-cover" /></div>`).join("")}
            ${bottom.map((src) => `<div class="relative col-span-2 row-span-1 w-full h-full overflow-hidden"><img src="${src}" class="w-full h-full object-cover" /></div>`).join("")}
          </div>`;
        }

        $rows.eq(galleryRowIndex).replaceWith(`<tr><td colspan="2">${bentoHtml}</td></tr>`);
      }
      // ----------------------------------------------------
    });

    infoboxHtml = $topLevelInfoboxes
      .map((_, el) => $.html(el))
      .get()
      .join("");
    $topLevelInfoboxes.remove();
  }

  // frwiki climate chart relies on TemplateStyles not included in REST HTML.
  // Add critical inline styles so the diagram keeps its layout.
  $(".diag-climat").each((_, root) => {
    const $root = $(root);
    appendStyle(
      $root,
      "margin:1em auto;max-width:40em;border:1px solid var(--wiki-diag-border);border-radius:6px;padding:0.6em 0.8em;background:var(--wiki-diag-bg);color:var(--wiki-diag-text);"
    );

    $root.find(".diag-climat-titre").each((__, el) => {
      appendStyle($(el), "text-align:center;font-weight:700;font-size:0.95em;margin-bottom:0.4em;");
    });

    $root.find(".diag-climat-barres").each((__, el) => {
      appendStyle($(el), "position:relative;display:flex;justify-content:space-between;gap:2px;");
    });

    $root.find(".diag-climat-mois").each((__, el) => {
      appendStyle($(el), "display:flex;flex-direction:column;align-items:center;flex:1;min-width:0;");
    });

    $root.find(".diag-climat-zone").each((__, el) => {
      appendStyle($(el), "position:relative;width:100%;overflow:visible;");
    });

    $root.find(".diag-climat-separator").each((__, el) => {
      appendStyle($(el), "position:absolute;left:-1px;right:-1px;height:1px;background:var(--wiki-diag-separator);z-index:3;");
    });

    $root.find(".diag-climat-barre-prec").each((__, el) => {
      appendStyle(
        $(el),
        "position:absolute;bottom:0;left:12%;width:76%;background:linear-gradient(to top,#0097a7,#4dd0e1);border-radius:2px 2px 0 0;opacity:0.7;min-height:1px;z-index:0;"
      );
    });

    $root.find(".diag-climat-barre-temp").each((__, el) => {
      appendStyle(
        $(el),
        "position:absolute;left:22%;width:56%;background:linear-gradient(to top,#fb6a4a,#c0392b);border-radius:3px;min-height:2px;z-index:1;"
      );
    });

    $root.find(".diag-climat-val-tmax, .diag-climat-val-tmin, .diag-climat-val-prec").each((__, el) => {
      appendStyle($(el), "position:absolute;left:0;width:100%;text-align:center;font-size:0.72em;line-height:1;white-space:nowrap;z-index:2;");
    });

    $root.find(".diag-climat-val-tmax").each((__, el) => {
      appendStyle($(el), "color:var(--wiki-diag-tmax);font-weight:700;");
    });

    $root.find(".diag-climat-val-tmin").each((__, el) => {
      appendStyle($(el), "color:var(--wiki-diag-tmin);font-weight:700;");
    });

    $root.find(".diag-climat-val-prec").each((__, el) => {
      appendStyle($(el), "bottom:-1.2em;color:var(--wiki-diag-muted);");
    });

    $root.find(".diag-climat-label").each((__, el) => {
      appendStyle($(el), "margin-top:1.4em;font-size:0.85em;font-weight:600;color:var(--wiki-diag-label);line-height:1;");
    });

    $root.find(".diag-climat-legende").each((__, el) => {
      appendStyle($(el), "text-align:center;margin-top:0.3em;padding-top:0.3em;border-top:1px solid var(--wiki-diag-leg-border);font-size:0.82em;color:var(--wiki-diag-muted);");
    });
  });

  // Ensure all Kartographer static maps use our proxy route.
  // Some map images are not tagged with `mw-file-element`, so we cannot rely on that class.
  $("img").each((_, img) => {
    const $img = $(img);
    const proxiedMapSrc = toMapProxyUrl($img.attr("src") ?? "");
    if (!proxiedMapSrc) return;
    $img.attr("src", proxiedMapSrc);
    // Keep only one source so the browser never falls back to direct maps.wikimedia.org.
    $img.removeAttr("srcset");
  });

  // Improve image consistency:
  // - keep small icons/logos at natural size
  // - render medium/large media full-width in layout
  // NOTE: do not rewrite Wikimedia thumbnail URLs; some target widths return 400.
  $("img.mw-file-element").each((_, img) => {
    const $img = $(img);
    const cls = $img.attr("class") ?? "";
    if (cls.includes("mwe-math-fallback-image")) return;

    const declaredWidth = parseInt($img.attr("width") ?? "0", 10);
    if (declaredWidth >= 180) {
      $img.addClass("wiki-media-large");
      $img.closest(".thumb, .thumbinner, figure").addClass("wiki-media-large-wrap");
      return;
    }

    $img.addClass("wiki-media-small");
  });

  // Wrap article tables in a dedicated scroll container while preserving native table layout.
  $("table").each((_, table) => {
    const $table = $(table);
    if ($table.closest(".wiki-table-wrap").length > 0) return;
    $table.addClass("wiki-body-table");
    $table.wrap('<div class="wiki-table-wrap"></div>');
  });

  // Extract the first meaningful paragraph as a summary
  let summary: string | null = null;
  const $firstPara = $('p').not('.mw-empty-elt').first();
  if ($firstPara.length > 0) {
    summary = $firstPara.text().trim();
    // Optional: we can remove it from the main flow if we want it strictly separated,
    // but usually keeping it in the flow is safer for Wikipedia structure.
    // For now, we just copy it.
  }

  let html = $('body').html() || '';
  
  html = sanitizeHtmlFragment(html);
  if (infoboxHtml) {
    infoboxHtml = sanitizeHtmlFragment(infoboxHtml);
  }

  const titleText = $('title').text() || decodeURIComponent(slug).replace(/_/g, ' ');

  return {
    title: titleText,
    summary,
    html,
    infoboxHtml,
    toc,
  };
}

function decodeHtml(html: string) {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function getTrendingDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
  };
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isFilteredTrendingArticle(article: string) {
  const normalized = safeDecodeURIComponent(article).trim();
  if (!normalized) return true;

  if (
    normalized === "Main_Page" ||
    normalized === "Wikipédia:Accueil_principal" ||
    normalized === "Special:Search" ||
    normalized === "Spécial:Recherche"
  ) {
    return true;
  }

  if (
    normalized.startsWith(".") ||
    /^(xxx|xnxx)$/i.test(normalized)
  ) {
    return true;
  }

  return /^[^:]+:/.test(normalized);
}

function formatTrendingTitle(article: string) {
  return safeDecodeURIComponent(article).replace(/_/g, " ").trim();
}

async function searchWikipediaUncached(
  query: string,
  {
    limit = 12,
    retries = 2,
    language,
  }: {
    limit?: number;
    retries?: number;
    language?: string;
  } = {}
): Promise<WikipediaSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(`${wikipediaApiBase(language)}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", trimmed);
  url.searchParams.set("srlimit", String(limit));
  url.searchParams.set("srprop", "snippet");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await fetchWithRetries(
    url,
    {
      cache: "force-cache",
      headers: {
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      next: {
        revalidate: SEARCH_REVALIDATE_SECONDS,
        tags: ["wikipedia-search"],
      },
    },
    { retries }
  );

  if (!res || !res.ok) {
    return [];
  }

  let data: {
    query?: {
      search?: Array<{
        title: string;
        snippet?: string;
        pageid: number;
      }>;
    };
  } | null = null;
  try {
    data = (await res.json()) as {
      query?: {
        search?: Array<{
          title: string;
          snippet?: string;
          pageid: number;
        }>;
      };
    };
  } catch {
    return [];
  }

  const results = data?.query?.search ?? [];
  return results.map((r) => ({
    title: r.title,
    snippet: decodeHtml((r.snippet ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()),
    pageid: r.pageid,
  }));
}

const getCachedSearch = unstable_cache(
  async (query: string, limit: number, language: string) =>
    searchWikipediaUncached(query, {
      limit,
      retries: DEFAULT_RETRIES,
      language,
    }),
  ["wikipedia-search-v1"],
  {
    revalidate: SEARCH_REVALIDATE_SECONDS,
    tags: ["wikipedia-search"],
  }
);

export async function searchWikipedia(
  query: string,
  {
    limit = 12,
    retries = DEFAULT_RETRIES,
    language,
  }: {
    limit?: number;
    retries?: number;
    language?: string;
  } = {}
): Promise<WikipediaSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (retries !== DEFAULT_RETRIES) {
    return searchWikipediaUncached(trimmed, { limit, retries, language });
  }

  return getCachedSearch(trimmed, limit, normalizeWikiLanguage(language));
}

async function getTrendingTopicsUncached(
  language?: string,
  {
    limit = 6,
    retries = DEFAULT_RETRIES,
  }: {
    limit?: number;
    retries?: number;
  } = {}
): Promise<WikipediaTrendingTopic[]> {
  const normalizedLanguage = normalizeWikiLanguage(language);
  const { year, month, day } = getTrendingDate();
  const url = new URL(
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${normalizedLanguage}.wikipedia/all-access/${year}/${month}/${day}`
  );

  const res = await fetchWithRetries(
    url,
    {
      cache: "force-cache",
      headers: {
        "User-Agent": USER_AGENT,
        "Api-User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: {
        revalidate: TRENDING_REVALIDATE_SECONDS,
        tags: ["wikipedia-trending"],
      },
    },
    { retries }
  );

  if (!res || !res.ok) {
    return [];
  }

  let data:
    | {
        items?: Array<{
          articles?: Array<{
            article: string;
            views?: number;
          }>;
        }>;
      }
    | null = null;

  try {
    data = (await res.json()) as {
      items?: Array<{
        articles?: Array<{
          article: string;
          views?: number;
        }>;
      }>;
    };
  } catch {
    return [];
  }

  const articles = data?.items?.[0]?.articles ?? [];
  const seen = new Set<string>();

  return articles
    .filter((entry) => !isFilteredTrendingArticle(entry.article))
    .map((entry) => ({
      title: formatTrendingTitle(entry.article),
      views: entry.views ?? 0,
    }))
    .filter((entry) => {
      const key = entry.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

const getCachedTrendingTopics = unstable_cache(
  async (language: string, limit: number) =>
    getTrendingTopicsUncached(language, {
      limit,
      retries: DEFAULT_RETRIES,
    }),
  ["wikipedia-trending-v1"],
  {
    revalidate: TRENDING_REVALIDATE_SECONDS,
    tags: ["wikipedia-trending"],
  }
);

export async function getTrendingTopics(
  language?: string,
  {
    limit = 6,
    retries = DEFAULT_RETRIES,
  }: {
    limit?: number;
    retries?: number;
  } = {}
): Promise<WikipediaTrendingTopic[]> {
  const normalizedLanguage = normalizeWikiLanguage(language);

  if (retries !== DEFAULT_RETRIES) {
    return getTrendingTopicsUncached(normalizedLanguage, { limit, retries });
  }

  return getCachedTrendingTopics(normalizedLanguage, limit);
}
