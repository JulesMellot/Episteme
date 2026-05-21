import { Header } from "@/components/Header";
import { searchWikipedia } from "@/lib/wikipedia";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { ArrowRight, BookOpen, SearchX, Globe } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { normalizeWikiLanguage, resolveUiLocale, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import { cookies } from "next/headers";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  searchParams: Promise<{
    q?: string | string[];
    lang?: string | string[];
  }>;
}

function toSlug(title: string) {
  return encodeURIComponent(title.replace(/\s+/g, "_"));
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, lang } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? "";
  const trimmed = query.trim();
  const cookieStore = await cookies();
  const language = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value
  );
  const uiLocale = resolveUiLocale(language);
  const canonical = trimmed
    ? absoluteUrl(`/wiki/search?q=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(language)}`)
    : absoluteUrl(`/wiki/search?lang=${encodeURIComponent(language)}`);
  const description = trimmed
    ? uiLocale === "fr"
      ? `Resultats de recherche pour "${trimmed}" sur Wikipedia (${language}) avec Episteme.`
      : `Search results for "${trimmed}" on Wikipedia (${language}) with Episteme.`
    : uiLocale === "fr"
      ? `Rechercher sur Wikipedia avec Episteme, un lecteur rapide et une alternative a Wikiwand.`
      : `Search Wikipedia with Episteme, a fast reader and Wikiwand alternative.`;

  return {
    title:
      uiLocale === "fr"
        ? trimmed
          ? `Recherche : ${trimmed} (${language})`
          : `Recherche Wikipedia (${language})`
        : trimmed
          ? `Search: ${trimmed} (${language})`
          : `Wikipedia Search (${language})`,
    description,
    alternates: {
      canonical,
    },
    robots: trimmed
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q, lang } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? "";
  const trimmed = query.trim();
  const cookieStore = await cookies();
  const language = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value
  );
  const uiLocale = resolveUiLocale(language);
  const uiCopy =
    uiLocale === "fr"
      ? {
          searchPlaceholder: "Que voulez-vous savoir ?",
          searchCta: "Rechercher",
          emptyTitle: "Le savoir vous attend",
          emptyBody: "Parcourez des millions d’articles et enrichissez votre compréhension du monde.",
          noResultTitle: "Aucun résultat",
          noResultBodyPrefix: "Aucun article trouvé pour",
          searchResults: "Résultats de recherche",
          foundSuffix: "trouvés",
          article: "Article",
        }
      : {
          searchPlaceholder: "What do you want to know?",
          searchCta: "Search",
          emptyTitle: "Knowledge awaits",
          emptyBody: "Search through millions of articles and expand your understanding of the world.",
          noResultTitle: "Nothing found",
          noResultBodyPrefix: "We couldn't find any articles matching",
          searchResults: "Search Results",
          foundSuffix: "found",
          article: "Article",
        };

  const results = trimmed ? await searchWikipedia(trimmed, { language }) : [];

  return (
    <div className="min-h-[100dvh] bg-[#fdfdfc] dark:bg-[#0a0a0a] selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header hideSearch initialLanguage={language} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 max-w-3xl">
        {/* Search Bar Section */}
        <div className="mb-16 sm:mb-20">
          <SearchAutocomplete
            key={`${language}:${trimmed}`}
            language={language}
            placeholder={uiCopy.searchPlaceholder}
            defaultValue={trimmed}
            autoFocus={!trimmed}
            submitLabel={uiCopy.searchCta}
            variant="page"
          />
        </div>

        {/* Results or Empty States */}
        {!trimmed ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="w-24 h-24 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Globe className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 tracking-tighter">
              {uiCopy.emptyTitle}
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mb-12 leading-relaxed">
              {uiCopy.emptyBody}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Typography", "Quantum Mechanics", "Stoicism", "Neural Networks"].map(topic => (
                <Link 
                  key={topic} 
                  href={`/wiki/search?q=${encodeURIComponent(topic)}&lang=${encodeURIComponent(language)}`}
                  className="px-6 py-3 rounded-full bg-white dark:bg-[#111111] border border-zinc-200 dark:border-zinc-800/80 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm active:scale-95 transition-all duration-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-[#111111] flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800/50">
              <SearchX className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tighter">{uiCopy.noResultTitle}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-lg">
              {uiCopy.noResultBodyPrefix} &ldquo;{trimmed}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                {uiCopy.searchResults}
              </h2>
              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">
                {results.length} {uiCopy.foundSuffix}
              </span>
            </div>
            
            <ul className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50 border-y border-zinc-200/50 dark:border-zinc-800/50">
              {results.map((r) => (
                <li key={r.pageid} className="group">
                  <Link
                    href={`/wiki/${toSlug(r.title)}?lang=${encodeURIComponent(language)}`}
                    className="block py-8 hover:px-6 -mx-6 rounded-2xl hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-200">
                            {r.title}
                          </h3>
                        </div>
                        {r.snippet && (
                          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                            {r.snippet}
                          </p>
                        )}
                        <div className="mt-5 flex items-center gap-3 text-sm font-medium text-zinc-400 dark:text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {uiCopy.article}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 mt-2 w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
                        <ArrowRight className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
