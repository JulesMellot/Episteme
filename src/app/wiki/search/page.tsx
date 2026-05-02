import { Header } from "@/components/Header";
import { searchWikipedia } from "@/lib/wikipedia";
import { Search, ArrowRight, BookOpen, SearchX, Globe } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { normalizeWikiLanguage, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import { cookies } from "next/headers";

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

  return {
    title: trimmed ? `Search: ${trimmed} (${language}) - Episteme` : `Search (${language}) - Episteme`,
    description: trimmed
      ? `Search results for "${trimmed}" on Wikipedia (${language}).`
      : `Search Wikipedia (${language}) on Episteme.`,
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

  const results = trimmed ? await searchWikipedia(trimmed, { language }) : [];

  return (
    <div className="min-h-[100dvh] bg-[#fdfdfc] dark:bg-[#0a0a0a] selection:bg-zinc-200 dark:selection:bg-zinc-800">
      <Header hideSearch initialLanguage={language} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24 max-w-3xl">
        {/* Search Bar Section */}
        <div className="mb-16 sm:mb-20">
          <form action="/wiki/search" method="GET" className="relative w-full group">
            <div className="relative flex items-center">
              <Search className="absolute left-6 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors duration-300" />
              <input type="hidden" name="lang" value={language} />
              <input
                type="text"
                name="q"
                defaultValue={trimmed}
                placeholder="What do you want to know?"
                autoFocus={!trimmed}
                className="w-full pl-16 pr-32 py-5 sm:py-6 rounded-[2rem] bg-white dark:bg-[#111111] border border-zinc-200/80 dark:border-zinc-800/80 focus:border-zinc-300 dark:focus:border-zinc-700 focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-900/50 outline-none transition-all duration-300 text-lg sm:text-xl tracking-tight shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
              />
              <button 
                type="submit" 
                className="absolute right-3 sm:right-4 px-6 py-3 sm:py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[1.5rem] text-sm sm:text-base font-semibold hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Results or Empty States */}
        {!trimmed ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="w-24 h-24 rounded-full bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center mb-8 border border-zinc-100 dark:border-zinc-800/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Globe className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 tracking-tighter">
              Knowledge awaits
            </h2>
            <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mb-12 leading-relaxed">
              Search through millions of articles and expand your understanding of the world.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {["Typography", "Quantum Mechanics", "Stoicism", "Neural Networks"].map(topic => (
                <Link 
                  key={topic} 
                  href={`/wiki/search?q=${encodeURIComponent(topic)}&lang=${language}`}
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
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3 tracking-tighter">Nothing found</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-sm text-lg">
              We couldn&apos;t find any articles matching &ldquo;{trimmed}&rdquo;.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Search Results
              </h2>
              <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">
                {results.length} found
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
                            Article
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
