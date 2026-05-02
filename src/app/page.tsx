"use client";

import { Header } from "@/components/Header";
import { Search } from "lucide-react";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { useState } from "react";
import { DEFAULT_WIKI_LANGUAGE, readPreferredWikiLanguage, resolveUiLocale } from "@/lib/wiki-language";

export default function Home() {
  const [lang] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIKI_LANGUAGE;
    return readPreferredWikiLanguage();
  });
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          heroTag: "Episteme Reader 1.0",
          heroTitleLine1: "Le savoir,",
          heroTitleLine2: "magnifiquement rendu.",
          heroBody:
            "Un lecteur Wikipédia conçu avec soin, centré sur la typographie, les performances et la concentration.",
          searchPlaceholder: "Rechercher un sujet...",
          trending: "Sujets du moment",
          categories: {
            technology: "Technologie",
            framework: "Framework",
            design: "Design",
            humanities: "Sciences humaines",
            space: "Espace",
          },
        }
      : {
          heroTag: "Episteme Reader 1.0",
          heroTitleLine1: "Knowledge,",
          heroTitleLine2: "beautifully rendered.",
          heroBody: "A meticulously crafted Wikipedia reader focusing on typography, performance, and absolute focus.",
          searchPlaceholder: "Search any topic...",
          trending: "Trending Topics",
          categories: {
            technology: "Technology",
            framework: "Framework",
            design: "Design",
            humanities: "Humanities",
            space: "Space",
          },
        };
  const popularArticles = [
    { title: "React (software)", category: uiCopy.categories.technology },
    { title: "Next.js", category: uiCopy.categories.framework },
    { title: "Typography", category: uiCopy.categories.design },
    { title: "Philosophy", category: uiCopy.categories.humanities },
    { title: "SpaceX", category: uiCopy.categories.space },
    { title: "Artificial intelligence", category: uiCopy.categories.technology },
  ];

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <BackgroundBeams />
      <Header isHome={true} initialLanguage={lang} />
      
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl w-full text-center space-y-10">
          
          <div className="space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              {uiCopy.heroTag}
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-[1.1]">
              {uiCopy.heroTitleLine1} <br className="hidden sm:block" />
              <span className="text-zinc-400 dark:text-zinc-500">{uiCopy.heroTitleLine2}</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {uiCopy.heroBody}
            </p>
          </div>

          {/* Large Search Bar for Home */}
          <form action="/wiki/search" method="GET" className="relative max-w-2xl mx-auto w-full group">
            <div className="relative flex items-center transition-transform duration-300 group-focus-within:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 overflow-hidden">
                <Search className="absolute left-5 w-6 h-6 text-zinc-400" />
                <input type="hidden" name="lang" value={lang} />
                <input
                  type="text"
                  name="q"
                  required
                  placeholder={uiCopy.searchPlaceholder}
                  className="w-full pl-14 pr-6 py-5 bg-transparent outline-none text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                  autoComplete="off"
                />
                <div className="absolute right-3 hidden sm:flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-700">⌘</kbd>
                  <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-700">K</kbd>
                </div>
              </div>
            </div>
          </form>

          <div className="pt-10 border-t border-zinc-200/50 dark:border-zinc-800/50 max-w-2xl mx-auto w-full">
            <p className="text-sm font-mono text-zinc-500 mb-6 uppercase tracking-widest">{uiCopy.trending}</p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularArticles.map((article) => (
                <a
                  key={article.title}
                  href={`/wiki/${article.title.replace(/\s+/g, "_")}?lang=${encodeURIComponent(lang)}`}
                  className="group flex flex-col items-start px-4 py-3 rounded-xl bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mb-1">{article.category}</span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{article.title}</span>
                </a>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
