import { getPage } from "@/lib/wikipedia";
import { Sidebar } from "@/components/Sidebar";
import { HeaderOptimized } from "@/components/HeaderOptimized";
import { WikiMediaModalTrigger } from "@/components/WikiMediaModalTrigger";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import { normalizeWikiLanguage, resolveUiLocale } from "@/lib/wiki-language";
import { WikiDonationCTAClient } from "@/components/WikiDonationCTAClient";
import { WikiArticleContent } from "@/components/WikiArticleContent";
import { buildWikiArticleUrl, safeDecodeURIComponent, truncateDescription } from "@/lib/site";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    lang?: string | string[];
  }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  // safeDecodeURIComponent: bots hit malformed-percent URLs (e.g. a bare `%`),
  // which make raw decodeURIComponent throw URIError and crash metadata rendering.
  const decodedSlug = safeDecodeURIComponent(slug).replace(/_/g, " ");
  // Language comes from the URL only (proxy.ts guarantees `?lang` is present),
  // so the rendered page is fully determined by its URL and safe for the CDN to
  // cache. normalizeWikiLanguage falls back to the default for missing/invalid values.
  const language = normalizeWikiLanguage(Array.isArray(lang) ? lang[0] : lang);
  const uiLocale = resolveUiLocale(language);
  const page = await getPage(slug, 2, language);
  const title = page?.title ?? decodedSlug;
  const description = truncateDescription(
    page?.summary ??
      (uiLocale === "fr"
        ? `Lire ${title} sur Wikipedia (${language}) avec Episteme, un lecteur rapide et une alternative a Wikiwand.`
        : `Read ${title} from Wikipedia (${language}) on Episteme, a fast reader and Wikiwand alternative.`)
  );
  const canonicalUrl = buildWikiArticleUrl(slug, language);
  const openGraphImages =
    page?.kind === "file" && page.thumbUrl
      ? [
          {
            url: page.thumbUrl,
            alt: title,
          },
        ]
      : undefined;
  
  return {
    title:
      uiLocale === "fr"
        ? `${title} sur Wikipedia (${language})`
        : `${title} on Wikipedia (${language})`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: page?.kind === "file" ? "website" : "article",
      images: openGraphImages,
    },
    twitter: {
      card: openGraphImages ? "summary_large_image" : "summary",
      title,
      description,
      images: openGraphImages?.map((image) => image.url),
    },
  };
}

export default async function WikiPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { lang } = await searchParams;
  // Language from the URL only — see generateMetadata above. Keeps the page
  // cacheable per-language without cookie ambiguity.
  const language = normalizeWikiLanguage(Array.isArray(lang) ? lang[0] : lang);
  const uiLocale = resolveUiLocale(language);
  const uiCopy =
    uiLocale === "fr"
      ? {
          file: "Fichier",
          type: "Type",
          dimensions: "Dimensions",
          source: "Source",
          open: "Ouvrir",
          license: "Licence",
        }
      : {
          file: "File",
          type: "Type",
          dimensions: "Dimensions",
          source: "Source",
          open: "Open",
          license: "License",
        };
  const articleUiCopy =
    uiLocale === "fr"
      ? {
          quickFacts: "Faits rapides",
        }
      : {
          quickFacts: "Quick facts",
        };
  const page = await getPage(slug, 2, language);

  if (!page) {
    notFound();
  }

  if (page.kind === "file") {
    const imageSrc = page.thumbUrl ?? page.fileUrl;

    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        <HeaderOptimized initialLanguage={language} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-[1200px]">
          <header className="mb-10 pb-8 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <h1 className="wiki-article-title text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-[1.1]">
              {page.title}
            </h1>
            {page.summary && (
              <p className="mt-4 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[75ch]">
                {page.summary}
              </p>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            <div className="min-w-0">
              <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden">
                <a href={page.fileUrl} target="_blank" rel="noreferrer">
                  <Image
                    src={imageSrc}
                    alt={page.title}
                    width={page.width ?? 1600}
                    height={page.height ?? 900}
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="w-full h-auto block"
                    priority
                  />
                </a>
              </div>

              {page.descriptionHtml && (
                <div className="mt-8 wiki-content">
                  <div dangerouslySetInnerHTML={{ __html: page.descriptionHtml }} />
                </div>
              )}

              <WikiDonationCTAClient browserLanguage={language} />
            </div>

            <aside className="w-full lg:sticky lg:top-28 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-950/40 p-6">
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                {uiCopy.file}
              </div>
              <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400">{uiCopy.type}</span>
                  <span className="text-right font-mono">{page.mime ?? "—"}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400">{uiCopy.dimensions}</span>
                  <span className="text-right font-mono">
                    {page.width && page.height ? `${page.width}×${page.height}` : "—"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-zinc-500 dark:text-zinc-400">{uiCopy.source}</span>
                  <a
                    href={page.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-right font-mono text-zinc-900 dark:text-zinc-100 hover:underline"
                  >
                    {uiCopy.open}
                  </a>
                </div>
                {page.licenseHtml && (
                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                    <div className="text-zinc-500 dark:text-zinc-400 mb-1">{uiCopy.license}</div>
                    <div
                      className="font-mono text-sm text-zinc-900 dark:text-zinc-100"
                      dangerouslySetInnerHTML={{ __html: page.licenseHtml }}
                    />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <HeaderOptimized initialLanguage={language} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-[1600px] flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
        {/* Left Sidebar: Table of Contents */}
        <Sidebar toc={page.toc} language={language} />
        
        {/* Middle Column: Main Content */}
        <article className="wiki-article-shell flex-1 min-w-0 w-full pb-32 order-1 lg:order-none">
          <header className="mb-14 pb-8 border-b border-zinc-200/50 dark:border-zinc-800/50">
            <h1 className="wiki-article-title text-4xl md:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tighter leading-[1.1] mb-6">
              {page.title}
            </h1>
            
            {page.summary && (
              <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6 max-w-[70ch] tracking-tight">
                {page.summary}
              </p>
            )}
            
          </header>

          {page.infoboxHtml && (
            <details className="wiki-infobox-mobile w-full lg:hidden mb-10 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-900/30 overflow-hidden">
              <summary className="list-none cursor-pointer px-4 py-3 text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center justify-between">
                <span>{articleUiCopy.quickFacts}</span>
                <span className="text-zinc-400 dark:text-zinc-500 text-xs">+</span>
              </summary>
              <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden pb-4 px-4">
                <div
                  className="wiki-infobox"
                  dangerouslySetInnerHTML={{ __html: page.infoboxHtml }}
                />
              </div>
            </details>
          )}

          <WikiArticleContent html={page.html} language={language} />

          <WikiDonationCTAClient browserLanguage={language} />
        </article>

        {/* Right Sidebar: Infobox */}
        {page.infoboxHtml && (
          <aside className="wiki-infobox-aside hidden lg:block w-full lg:w-[320px] xl:w-[360px] shrink-0 lg:order-last mb-12 lg:mb-0 lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)]">
            <div className="relative h-full rounded-md overflow-hidden">
              <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pb-12">
                <div
                  className="wiki-infobox"
                  dangerouslySetInnerHTML={{ __html: page.infoboxHtml }}
                />
              </div>
              <div className="scroll-hint-fade scroll-hint-fade--box" aria-hidden />
            </div>
          </aside>
        )}
      </main>
      <div className="scroll-hint-fade scroll-hint-fade--page" aria-hidden />
      <WikiMediaModalTrigger language={language} />
    </div>
  );
}
