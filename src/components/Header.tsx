"use client";

import { Moon, Sun, Coffee, Monitor } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, resolveUiLocale } from "@/lib/wiki-language";

interface HeaderProps {
  isHome?: boolean;
  hideSearch?: boolean;
  initialLanguage?: string;
}

export function Header({ isHome = false, hideSearch = false, initialLanguage }: HeaderProps) {
  const [lang, setLang] = useState(() => normalizeWikiLanguage(initialLanguage ?? DEFAULT_WIKI_LANGUAGE));
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          searchPlaceholder: "Rechercher sur Wikipédia...",
          lightMode: "Mode clair",
          darkMode: "Mode sombre",
          sepiaMode: "Sépia (chaud)",
          dimMode: "Tamisé (froid)",
        }
      : {
          searchPlaceholder: "Search Wikipedia...",
          lightMode: "Light Mode",
          darkMode: "Dark Mode",
          sepiaMode: "Sepia (Warm)",
          dimMode: "Dim (Cool)",
        };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled || !isHome 
          ? "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]" 
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-[1400px]">
        <div className="flex items-center space-x-3">
          <Link href={`/?lang=${encodeURIComponent(lang)}`} className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
              Episteme
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {(!isHome && !hideSearch) && (
            <SearchAutocomplete
              language={lang}
              placeholder={uiCopy.searchPlaceholder}
              variant="header"
              showShortcut
            />
          )}

          <LanguageSwitcher initialLanguage={lang} onLanguageChange={setLang} />

          {mounted && (
            <div className="flex items-center gap-1 bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-2 rounded-xl transition-all duration-200 ${theme === 'light' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                title={uiCopy.lightMode}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'bg-zinc-800 shadow-sm text-white' : 'text-zinc-400 hover:text-zinc-300'}`}
                title={uiCopy.darkMode}
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("sepia")}
                className={`p-2 rounded-xl transition-all duration-200 ${theme === 'sepia' ? 'bg-[#efe3cc] ring-1 ring-[#c6a882] shadow-sm text-[#3f2f22]' : 'text-zinc-400 hover:text-amber-700/70'}`}
                title={uiCopy.sepiaMode}
              >
                <Coffee className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dim")}
                className={`p-2 rounded-xl transition-all duration-200 ${theme === 'dim' ? 'bg-[#1f2937] ring-1 ring-[#475569] shadow-sm text-[#7dd3fc]' : 'text-zinc-400 hover:text-sky-400/80'}`}
                title={uiCopy.dimMode}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
