"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackgroundBeams } from "@/components/BackgroundBeams";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { readPreferredWikiLanguage, resolveUiLocale } from "@/lib/wiki-language";
import { ArrowRight, BookOpen, Layout, Moon, Type } from "lucide-react";

interface WikipediaReaderClientProps {
  initialLanguage: string;
}

export function WikipediaReaderClient({ initialLanguage }: WikipediaReaderClientProps) {
  const [lang] = useState(() => {
    if (typeof window === "undefined") return initialLanguage;
    return readPreferredWikiLanguage(window.location.search || `?lang=${initialLanguage}`);
  });
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          title: "Le lecteur Wikipédia moderne",
          subtitle: "Redécouvrez l'encyclopédie libre avec une interface conçue exclusivement pour le confort de lecture.",
          searchPlaceholder: "Que voulez-vous apprendre ?",
          introTitle: "Pourquoi utiliser un lecteur Wikipédia ?",
          introBody: "Wikipédia est la plus grande ressource de connaissances de l'humanité, mais son interface n'a pas toujours suivi les standards modernes de lecture sur écran. Episteme agit comme une surcouche (un \"reader\") qui prend le contenu de Wikipédia et le présente de manière optimale.",
          features: [
            {
              icon: <Type className="w-6 h-6" />,
              title: "Typographie soignée",
              desc: "Des polices lisibles, une largeur de ligne parfaite et un interlignage aéré pour réduire la fatigue oculaire."
            },
            {
              icon: <Moon className="w-6 h-6" />,
              title: "Vrai mode sombre",
              desc: "Lisez la nuit sans vous éblouir grâce aux thèmes sombre, sépia et tamisé intégrés nativement."
            },
            {
              icon: <Layout className="w-6 h-6" />,
              title: "Mise en page zen",
              desc: "Adieu les bandeaux d'appel aux dons invasifs et les menus complexes. Juste le texte et vous."
            },
            {
              icon: <BookOpen className="w-6 h-6" />,
              title: "Sommaire interactif",
              desc: "Naviguez facilement dans les longs articles grâce à une table des matières claire et toujours accessible."
            }
          ],
          cta: "Commencer à lire",
        }
      : {
          title: "The Modern Wikipedia Reader",
          subtitle: "Rediscover the free encyclopedia with an interface designed exclusively for reading comfort.",
          searchPlaceholder: "What do you want to learn?",
          introTitle: "Why use a Wikipedia reader?",
          introBody: "Wikipedia is humanity's greatest knowledge resource, but its interface hasn't always kept up with modern screen reading standards. Episteme acts as a layer (a \"reader\") that takes Wikipedia's content and presents it optimally.",
          features: [
            {
              icon: <Type className="w-6 h-6" />,
              title: "Beautiful typography",
              desc: "Readable fonts, perfect line width, and airy line height to reduce eye strain."
            },
            {
              icon: <Moon className="w-6 h-6" />,
              title: "True dark mode",
              desc: "Read at night without glare thanks to natively integrated dark, sepia, and dim themes."
            },
            {
              icon: <Layout className="w-6 h-6" />,
              title: "Zen layout",
              desc: "Goodbye invasive donation banners and complex menus. Just you and the text."
            },
            {
              icon: <BookOpen className="w-6 h-6" />,
              title: "Interactive TOC",
              desc: "Navigate long articles easily with a clear and always accessible table of contents."
            }
          ],
          cta: "Start reading",
        };

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <BackgroundBeams />
      <Header initialLanguage={lang} />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl w-full text-center space-y-12">
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

          <section className="pt-12 text-left">
            <div className="bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-8 sm:p-12 backdrop-blur-sm mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
                {uiCopy.introTitle}
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                {uiCopy.introBody}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {uiCopy.features.map((feature, i) => (
                <div key={i} className="bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                href={`/wiki/${encodeURIComponent(uiLocale === "fr" ? "Typographie" : "Typography")}?lang=${encodeURIComponent(lang)}`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium text-lg hover:scale-105 transition-transform"
              >
                {uiCopy.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer language={lang} />
    </div>
  );
}
