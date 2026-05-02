"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  DEFAULT_WIKI_LANGUAGE,
  normalizeWikiLanguage,
  POPULAR_WIKI_LANGUAGES,
  resolveUiLocale,
  WIKI_LANGUAGE_COOKIE_NAME,
  WIKI_LANGUAGE_STORAGE_KEY,
} from "@/lib/wiki-language";

interface LanguageSwitcherProps {
  onLanguageChange?: (language: string) => void;
  initialLanguage?: string;
}

export function LanguageSwitcher({ onLanguageChange, initialLanguage }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(() =>
    normalizeWikiLanguage(initialLanguage ?? DEFAULT_WIKI_LANGUAGE)
  );
  const [customLanguage, setCustomLanguage] = useState(currentLanguage);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const uiLocale = resolveUiLocale(currentLanguage);
  const uiCopy =
    uiLocale === "fr"
      ? {
          switcherTitle: "Changer la langue Wikipédia",
          contentLanguage: "Langue du contenu",
          languageCode: "Code langue",
          customPlaceholder: "ex: nl, sv, ko...",
          apply: "Appliquer",
        }
      : {
          switcherTitle: "Change Wikipedia language",
          contentLanguage: "Content language",
          languageCode: "Language code",
          customPlaceholder: "e.g. nl, sv, ko...",
          apply: "Apply",
        };

  useEffect(() => {
    localStorage.setItem(WIKI_LANGUAGE_STORAGE_KEY, currentLanguage);
    document.cookie = `${WIKI_LANGUAGE_COOKIE_NAME}=${encodeURIComponent(currentLanguage)}; path=/; max-age=31536000; samesite=lax`;
  }, [currentLanguage]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const applyLanguage = (language: string) => {
    const normalized = normalizeWikiLanguage(language);
    if (normalized === currentLanguage) {
      setOpen(false);
      return;
    }

    setCurrentLanguage(normalized);
    setCustomLanguage(normalized);
    onLanguageChange?.(normalized);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", normalized);
    window.location.assign(url.toString());
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-900 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
        title={uiCopy.switcherTitle}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage}</span>
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm shadow-xl p-2 z-50">
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {uiCopy.contentLanguage}
          </div>
          <div className="max-h-56 overflow-y-auto pr-1">
            {POPULAR_WIKI_LANGUAGES.map((lang) => {
              const active = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => applyLanguage(lang.code)}
                  className="w-full flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <span className="text-zinc-800 dark:text-zinc-200">{`${lang.label} (${lang.code})`}</span>
                  {active && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-zinc-200/70 dark:border-zinc-800/70 pt-2">
            <label htmlFor="custom-lang" className="sr-only">
              {uiCopy.languageCode}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="custom-lang"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 15))}
                className="flex-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50 dark:bg-zinc-900 px-2 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder={uiCopy.customPlaceholder}
              />
              <button
                type="button"
                onClick={() => applyLanguage(customLanguage)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {uiCopy.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
