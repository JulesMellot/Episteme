"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { readPreferredWikiLanguage, resolveUiLocale } from "@/lib/wiki-language";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface WikiwandAlternativeClientProps {
  initialLanguage: string;
}

export function WikiwandAlternativeClient({ initialLanguage }: WikiwandAlternativeClientProps) {
  const [lang] = useState(() => {
    if (typeof window === "undefined") return initialLanguage;
    return readPreferredWikiLanguage(window.location.search || `?lang=${initialLanguage}`);
  });
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          title: "La meilleure alternative à Wikiwand",
          subtitle: "Lisez Wikipédia sans distractions. Episteme est conçu pour être rapide, lisible et respectueux de votre attention.",
          searchPlaceholder: "Cherchez n'importe quel sujet...",
          whyTitle: "Pourquoi chercher une alternative ?",
          whyBody: "Wikiwand a longtemps été le choix par défaut pour améliorer l'interface de Wikipédia. Mais avec le temps, l'ajout de publicités, de bannières et de fonctionnalités superflues a alourdi l'expérience de lecture.",
          epistemeApproach: "L'approche d'Episteme",
          epistemeBody: "Episteme revient à l'essentiel : le savoir. Nous avons créé un lecteur centré sur la typographie, avec un mode sombre parfait, une table des matières flottante et des images sublimées, sans aucune publicité.",
          features: [
            "100% gratuit et sans publicité",
            "Mise en page épurée et typographie soignée",
            "Thèmes sombre, clair, sépia et tamisé",
            "Recherche rapide et multilingue",
            "Navigation fluide sans rechargement lourd"
          ],
          cta: "Essayer avec un article au hasard",
        }
      : {
          title: "The best Wikiwand alternative",
          subtitle: "Read Wikipedia without distractions. Episteme is built to be fast, readable, and respectful of your attention.",
          searchPlaceholder: "Search any topic...",
          whyTitle: "Why look for an alternative?",
          whyBody: "Wikiwand has long been the default choice for improving Wikipedia's interface. But over time, the addition of ads, banners, and unnecessary features has made the reading experience heavier.",
          epistemeApproach: "The Episteme approach",
          epistemeBody: "Episteme goes back to basics: knowledge. We created a typography-first reader with perfect dark mode, a floating table of contents, and beautiful image handling, with zero ads.",
          features: [
            "100% free and ad-free",
            "Clean layout and beautiful typography",
            "Dark, light, sepia, and dim themes",
            "Fast, multi-language search",
            "Smooth navigation without heavy reloads"
          ],
          cta: "Try with a random article",
        };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <BackgroundBeams />
      <Header initialLanguage={lang} />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl w-full text-center space-y-10">
          <div className="space-y-6 pt-10">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-[1.1]">
              {uiCopy.title}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              {uiCopy.subtitle}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <SearchAutocomplete
              language={lang}
              placeholder={uiCopy.searchPlaceholder}
              variant="page"
              showShortcut
            />
          </div>

          <section className="pt-16 text-left space-y-12">
            <div className="grid sm:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                  {uiCopy.whyTitle}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {uiCopy.whyBody}
                </p>
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                  {uiCopy.epistemeApproach}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {uiCopy.epistemeBody}
                </p>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 sm:p-10 backdrop-blur-sm">
              <ul className="grid sm:grid-cols-2 gap-4">
                {uiCopy.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-10 flex justify-center">
                <Link
                  href={`/wiki/${encodeURIComponent(uiLocale === "fr" ? "Philosophie" : "Philosophy")}?lang=${encodeURIComponent(lang)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium hover:scale-105 transition-transform"
                >
                  {uiCopy.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer language={lang} />
    </div>
  );
}
