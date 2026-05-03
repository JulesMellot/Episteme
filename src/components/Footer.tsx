"use client";

import Link from "next/link";
import { resolveUiLocale } from "@/lib/wiki-language";

interface FooterProps {
  language: string;
}

export function Footer({ language }: FooterProps) {
  const uiLocale = resolveUiLocale(language);
  const uiCopy =
    uiLocale === "fr"
      ? {
          alternative: "Alternative à Wikiwand",
          reader: "Lecteur Wikipédia",
        }
      : {
          alternative: "Wikiwand Alternative",
          reader: "Wikipedia Reader",
        };

  return (
    <footer className="relative z-10 w-full py-10 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-transparent mt-auto">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-zinc-500 dark:text-zinc-400">
        <div>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Episteme</span> © {new Date().getFullYear()}
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-6">
          <Link 
            href={`/wikiwand-alternative?lang=${encodeURIComponent(language)}`}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {uiCopy.alternative}
          </Link>
          <Link 
            href={`/wikipedia-reader?lang=${encodeURIComponent(language)}`}
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {uiCopy.reader}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
