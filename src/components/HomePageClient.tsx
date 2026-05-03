"use client";

import Link from "next/link";
import { ArrowRight, Puzzle, Zap, BookOpen, Code } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import {
  readPreferredWikiLanguage,
  resolveUiLocale,
} from "@/lib/wiki-language";
import type { WikipediaTrendingTopic } from "@/lib/wikipedia";

interface HomePageClientProps {
  initialLanguage: string;
  trendingTopics: WikipediaTrendingTopic[];
}

const EXTENSION_REPO_URL = "https://github.com/JulesMellot/episteme_extension";

export function HomePageClient({ initialLanguage, trendingTopics }: HomePageClientProps) {
  const [lang] = useState(() => {
    if (typeof window === "undefined") return initialLanguage;
    return readPreferredWikiLanguage(window.location.search || `?lang=${initialLanguage}`);
  });
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          heroTitleLine1: "Le savoir,",
          heroTitleLine2: "magnifiquement rendu.",
          heroBody:
            "Un lecteur Wikipedia conçu avec soin, centré sur la typographie, les performances et la concentration.",
          searchPlaceholder: "Rechercher un sujet...",
          trending: "Sujets du moment",
          trendingEmpty: "A decouvrir",
          categories: {
            technology: "Technologie",
            framework: "Framework",
            design: "Design",
            humanities: "Sciences humaines",
            space: "Espace",
          },
          bentoMainTitle: "L'encyclopédie, sans le bruit.",
          bentoMainBody: "Une interface épurée, pensée pour la lecture longue. Pas de bannières, pas de distractions, juste la connaissance.",
          bentoMainCta: "Chercher un article",
          bentoMainCtaSecondary: "Essayer au hasard",
          bentoSpeedTitle: "Vitesse absolue",
          bentoSpeedBody: "Chargement instantané sur mobile et desktop.",
          bentoThemesTitle: "Confort visuel",
          bentoThemesBody: "Typographie soignée, modes sombre et sépia.",
          bentoOpenTitle: "Alternative libre",
          bentoOpenBody: "Code source ouvert, transparent et respectueux de la vie privée.",
          extensionTitle: "Ouvre Wikipedia dans Episteme en un clic",
          extensionBody:
            "Installe Episteme Redirect pour envoyer automatiquement les articles Wikipedia vers une lecture plus propre. L'extension fonctionne avec Chrome et Firefox, et peut aussi pointer vers ta propre instance.",
          extensionCta: "Voir l'extension sur GitHub",
          bentoFaqTitle: "Questions fréquentes",
          faqs: [
            {
              question: "Est-ce une alternative à Wikiwand ?",
              answer:
                "Oui, conçue pour être plus rapide et moins chargée visuellement.",
            },
            {
              question: "Comment ça marche ?",
              answer:
                "C'est un lecteur alternatif. Il récupère les articles de Wikipedia en temps réel et les affiche dans une interface optimisée pour la lecture.",
            },
            {
              question: "C'est gratuit ?",
              answer:
                "Oui, l'outil est 100% gratuit, open source et sans aucune publicité.",
            },
          ],
        }
      : {
          heroTitleLine1: "Knowledge,",
          heroTitleLine2: "beautifully rendered.",
          heroBody:
            "A meticulously crafted Wikipedia reader focusing on typography, performance, and absolute focus.",
          searchPlaceholder: "Search any topic...",
          trending: "Trending Topics",
          trendingEmpty: "Discover",
          categories: {
            technology: "Technology",
            framework: "Framework",
            design: "Design",
            humanities: "Humanities",
            space: "Space",
          },
          bentoMainTitle: "The encyclopedia, without the noise.",
          bentoMainBody: "A refined interface designed for long-form reading. No banners, no distractions, just the text.",
          bentoMainCta: "Search an article",
          bentoMainCtaSecondary: "Random article",
          bentoSpeedTitle: "Absolute speed",
          bentoSpeedBody: "Instant loading on mobile and desktop.",
          bentoThemesTitle: "Visual comfort",
          bentoThemesBody: "Crafted typography, dark and sepia modes.",
          bentoOpenTitle: "Open alternative",
          bentoOpenBody: "Open source, transparent, and privacy-respecting.",
          extensionTitle: "Open Wikipedia in Episteme with one click",
          extensionBody:
            "Install Episteme Redirect to automatically send Wikipedia articles into a cleaner reading flow. The extension works with Chrome and Firefox, and can also point to your own hosted instance.",
          extensionCta: "View extension on GitHub",
          bentoFaqTitle: "Frequently Asked Questions",
          faqs: [
            {
              question: "Is this an alternative to Wikiwand?",
              answer:
                "Yes, designed to be faster and visually lighter.",
            },
            {
              question: "How does it work?",
              answer:
                "It's an alternative reader. It fetches Wikipedia articles in real-time and displays them in a reading-optimized interface.",
            },
            {
              question: "Is it free?",
              answer:
                "Yes, the tool is 100% free, open source, and ad-free.",
            },
          ],
        };
  const fallbackArticles = [
    { title: "React (software)", category: uiCopy.categories.technology },
    { title: "Next.js", category: uiCopy.categories.framework },
    { title: "Typography", category: uiCopy.categories.design },
    { title: "Philosophy", category: uiCopy.categories.humanities },
    { title: "SpaceX", category: uiCopy.categories.space },
    { title: "Artificial intelligence", category: uiCopy.categories.technology },
  ];
  const displayedTrendingTopics =
    trendingTopics.length > 0
      ? trendingTopics.map((topic) => ({
          title: topic.title,
          category: uiCopy.trending,
        }))
      : fallbackArticles.map((article) => ({
          title: article.title,
          category: article.category ?? uiCopy.trendingEmpty,
        }));

  const articleHref = `/wiki/${encodeURIComponent("Wikipedia").replace(/%20/g, "_")}?lang=${encodeURIComponent(lang)}`;
  const searchHref = `/wiki/search?lang=${encodeURIComponent(lang)}`;

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <BackgroundBeams />
      <Header isHome initialLanguage={lang} />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl w-full text-center space-y-10">
          <div className="space-y-4 pt-10 sm:pt-20">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-[1.1]">
              {uiCopy.heroTitleLine1} <br className="hidden sm:block" />
              <span className="text-zinc-400 dark:text-zinc-500">{uiCopy.heroTitleLine2}</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {uiCopy.heroBody}
            </p>
          </div>

          <SearchAutocomplete
            language={lang}
            placeholder={uiCopy.searchPlaceholder}
            variant="home"
            showShortcut
          />

          <div className="w-full max-w-3xl mx-auto mt-4">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {displayedTrendingTopics.map((article, index) => (
                <div key={article.title} className="flex items-center gap-x-4">
                  <a
                    href={`/wiki/${encodeURIComponent(article.title).replace(/%20/g, "_")}?lang=${encodeURIComponent(lang)}`}
                    className="text-sm font-medium text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {article.title}
                  </a>
                  {index < displayedTrendingTopics.length - 1 && (
                    <span className="text-zinc-300 dark:text-zinc-700 text-xs select-none">•</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <section className="pt-4 sm:pt-8">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl px-6 py-12 sm:px-16 sm:py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-zinc-800/20 pointer-events-none" />
              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="inline-flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 p-3 mb-6 shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-700/50">
                  <Puzzle className="h-6 w-6 text-zinc-700 dark:text-zinc-300" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {uiCopy.extensionTitle}
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {uiCopy.extensionBody}
                </p>
                <div className="mt-8">
                  <a
                    href={EXTENSION_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-medium text-white transition-all hover:bg-zinc-800 hover:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] dark:hover:shadow-[0_6px_20px_rgba(255,255,255,0.15)]"
                  >
                    {uiCopy.extensionCta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="pt-16 pb-24 w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

              {/* Main Hook - Spans 2x2 */}
              <div className="md:col-span-2 lg:col-span-2 md:row-span-2 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 sm:p-10 flex flex-col justify-between shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/40 group">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
                    {uiCopy.bentoMainTitle}
                  </h2>
                  <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg max-w-[32ch]">
                    {uiCopy.bentoMainBody}
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={searchHref}
                    className="inline-flex items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-6 py-3 text-sm font-medium transition-all hover:scale-[0.98] shadow-[0_4px_14px_0_rgba(0,0,0,0.1)]"
                  >
                    {uiCopy.bentoMainCta}
                  </Link>
                  <Link
                    href={articleHref}
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 transition-all hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                  >
                    {uiCopy.bentoMainCtaSecondary}
                  </Link>
                </div>
              </div>

              {/* Speed - Spans 1x1 */}
              <div className="rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 flex flex-col gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/40">
                <Zap className="w-7 h-7 text-emerald-500" />
                <div className="mt-auto">
                  <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{uiCopy.bentoSpeedTitle}</h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{uiCopy.bentoSpeedBody}</p>
                </div>
              </div>

              {/* Themes - Spans 1x1 */}
              <div className="rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 flex flex-col gap-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/40">
                <BookOpen className="w-7 h-7 text-amber-500" />
                <div className="mt-auto">
                  <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{uiCopy.bentoThemesTitle}</h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{uiCopy.bentoThemesBody}</p>
                </div>
              </div>

              {/* Open Source - Spans 2x1 */}
              <div className="md:col-span-2 lg:col-span-2 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors hover:bg-white/60 dark:hover:bg-zinc-900/40">
                <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-800 p-4 shrink-0">
                  <Code className="w-8 h-8 text-zinc-700 dark:text-zinc-300" />
                </div>
                <div>
                  <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-lg">{uiCopy.bentoOpenTitle}</h3>
                  <p className="mt-1 text-zinc-500 dark:text-zinc-400 leading-relaxed">{uiCopy.bentoOpenBody}</p>
                </div>
              </div>

              {/* FAQ - Spans 4x1 (Wide bottom) */}
              <div className="md:col-span-3 lg:col-span-4 rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-xl p-8 sm:p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-8">
                  {uiCopy.bentoFaqTitle}
                </h3>
                <div className="grid gap-8 md:grid-cols-3">
                  {uiCopy.faqs.map((faq) => (
                    <div key={faq.question} className="space-y-2">
                      <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">{faq.question}</h4>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </section>
        </div>
      </main>
    </div>
  );
}
