"use client";

import { ArrowUp, Eye, EyeOff, ListTree, SlidersHorizontal, Type, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [readingProgress, setReadingProgress] = useState(0);
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [headingTypography, setHeadingTypography] = useState<"editorial" | "classic">(() => {
    if (typeof window === "undefined") {
      return "editorial";
    }
    const storedTypography = window.localStorage.getItem("episteme-heading-typography");
    return storedTypography === "classic" || storedTypography === "editorial"
      ? storedTypography
      : "editorial";
  });
  const [readingSize, setReadingSize] = useState<"90" | "100" | "110" | "120">(() => {
    if (typeof window === "undefined") return "100";
    const stored = window.localStorage.getItem("episteme-reading-size");
    return stored === "90" || stored === "100" || stored === "110" || stored === "120"
      ? stored
      : "100";
  });
  const [readingWidth, setReadingWidth] = useState<"compact" | "comfort" | "wide">(() => {
    if (typeof window === "undefined") return "comfort";
    const stored = window.localStorage.getItem("episteme-reading-width");
    return stored === "compact" || stored === "comfort" || stored === "wide"
      ? stored
      : "comfort";
  });
  const [readingLineHeight, setReadingLineHeight] = useState<"normal" | "airy">(() => {
    if (typeof window === "undefined") return "normal";
    return window.localStorage.getItem("episteme-reading-line-height") === "airy"
      ? "airy"
      : "normal";
  });
  const [uiDensity, setUiDensity] = useState<"comfort" | "compact">(() => {
    if (typeof window === "undefined") return "comfort";
    return window.localStorage.getItem("episteme-ui-density") === "compact"
      ? "compact"
      : "comfort";
  });
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("episteme-focus-mode") === "on";
  });
  const [imageLayout, setImageLayout] = useState<"inline" | "float-right">(() => {
    if (typeof window === "undefined") return "inline";
    return window.localStorage.getItem("episteme-image-layout") === "float-right"
      ? "float-right"
      : "inline";
  });
  const [pinQuickFacts, setPinQuickFacts] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("episteme-pin-quick-facts") === "on";
  });
  const uiLocale = resolveUiLocale(lang);
  const uiCopy =
    uiLocale === "fr"
      ? {
          searchPlaceholder: "Rechercher sur Wikipédia...",
          lightMode: "Mode clair",
          darkMode: "Mode sombre",
          sepiaMode: "Sépia (chaud)",
          dimMode: "Tamisé (froid)",
          displaySettings: "Réglages d'affichage",
          close: "Fermer",
          themeSection: "Thème",
          typographySection: "Typographie des titres",
          typographyEditorial: "Éditoriale (Playfair)",
          typographyClassic: "Classique (Sora)",
          readingSection: "Lecture",
          textSize: "Taille du texte",
          readingWidth: "Largeur de lecture",
          lineHeight: "Interligne",
          density: "Densité UI",
          modeCompact: "Compact",
          modeComfort: "Confort",
          modeWide: "Large",
          modeNormal: "Normal",
          modeAiry: "Aéré",
          distractionFree: "Mode sans distraction",
          imageLayout: "Mise en page des images",
          imageInline: "Inline",
          imageFloatRight: "Flottantes à droite",
          quickFacts: "Quick facts épinglées",
          backToContents: "Retour au sommaire",
          scrollTop: "Remonter",
          exitFocusMode: "Quitter le mode focus",
        }
      : {
          searchPlaceholder: "Search Wikipedia...",
          lightMode: "Light Mode",
          darkMode: "Dark Mode",
          sepiaMode: "Sepia (Warm)",
          dimMode: "Dim (Cool)",
          displaySettings: "Display settings",
          close: "Close",
          themeSection: "Theme",
          typographySection: "Heading typography",
          typographyEditorial: "Editorial (Playfair)",
          typographyClassic: "Classic (Sora)",
          readingSection: "Reading",
          textSize: "Text size",
          readingWidth: "Reading width",
          lineHeight: "Line height",
          density: "UI density",
          modeCompact: "Compact",
          modeComfort: "Comfort",
          modeWide: "Wide",
          modeNormal: "Normal",
          modeAiry: "Airy",
          distractionFree: "Distraction-free mode",
          imageLayout: "Image layout",
          imageInline: "Inline",
          imageFloatRight: "Float right",
          quickFacts: "Pin quick facts",
          backToContents: "Back to contents",
          scrollTop: "Scroll to top",
          exitFocusMode: "Exit focus mode",
        };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
      setReadingProgress(progress);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-typography", headingTypography);
    window.localStorage.setItem("episteme-heading-typography", headingTypography);
  }, [headingTypography, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-reading-size", readingSize);
    window.localStorage.setItem("episteme-reading-size", readingSize);
  }, [mounted, readingSize]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-reading-width", readingWidth);
    window.localStorage.setItem("episteme-reading-width", readingWidth);
  }, [mounted, readingWidth]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-reading-line-height", readingLineHeight);
    window.localStorage.setItem("episteme-reading-line-height", readingLineHeight);
  }, [mounted, readingLineHeight]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-ui-density", uiDensity);
    window.localStorage.setItem("episteme-ui-density", uiDensity);
  }, [mounted, uiDensity]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-image-layout", imageLayout);
    window.localStorage.setItem("episteme-image-layout", imageLayout);
  }, [imageLayout, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-focus-mode", focusMode ? "on" : "off");
    window.localStorage.setItem("episteme-focus-mode", focusMode ? "on" : "off");
  }, [focusMode, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-pin-quick-facts", pinQuickFacts ? "on" : "off");
    window.localStorage.setItem("episteme-pin-quick-facts", pinQuickFacts ? "on" : "off");
  }, [mounted, pinQuickFacts]);

  useEffect(() => {
    if (!isDisplayModalOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDisplayModalOpen(false);
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [isDisplayModalOpen]);

  const handleTypographyChange = (value: "editorial" | "classic") => {
    setHeadingTypography(value);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToContents = () => {
    const tocSection = document.querySelector(".wiki-toc-mobile, .wiki-toc-desktop");
    if (tocSection instanceof HTMLElement) {
      tocSection.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const firstHeading = document.querySelector(".wiki-content h2");
    if (firstHeading instanceof HTMLElement) {
      firstHeading.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header 
      className={cn(
        "app-header sticky top-0 z-50 w-full transition-all duration-300",
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
            <button
              type="button"
              onClick={() => setIsDisplayModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors duration-200"
              title={uiCopy.displaySettings}
              aria-label={uiCopy.displaySettings}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <Type className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {mounted &&
        isDisplayModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm px-4 py-8"
            onClick={() => setIsDisplayModalOpen(false)}
            role="presentation"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={uiCopy.displaySettings}
              className="mx-auto max-w-xl w-full rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-950/95 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {uiCopy.displaySettings}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsDisplayModalOpen(false)}
                  className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                  aria-label={uiCopy.close}
                  title={uiCopy.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    {uiCopy.themeSection}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${theme === "light" ? "bg-white border-zinc-300 text-zinc-900 shadow-sm" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.lightMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${theme === "dark" ? "bg-zinc-900 border-zinc-700 text-zinc-100 shadow-sm" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.darkMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("sepia")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${theme === "sepia" ? "bg-[#efe3cc] border-[#c6a882] text-[#3f2f22] shadow-sm" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.sepiaMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme("dim")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${theme === "dim" ? "bg-[#1f2937] border-[#475569] text-[#7dd3fc] shadow-sm" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.dimMode}
                    </button>
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                    {uiCopy.typographySection}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypographyChange("editorial")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${headingTypography === "editorial" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.typographyEditorial}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypographyChange("classic")}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all ${headingTypography === "classic" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                    >
                      {uiCopy.typographyClassic}
                    </button>
                  </div>
                </section>

              <section>
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                  {uiCopy.readingSection}
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      {uiCopy.textSize}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {(["90", "100", "110", "120"] as const).map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setReadingSize(size)}
                          className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingSize === size ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
                        >
                          {size}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      {uiCopy.readingWidth}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReadingWidth("compact")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingWidth === "compact" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeCompact}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingWidth("comfort")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingWidth === "comfort" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeComfort}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingWidth("wide")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingWidth === "wide" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeWide}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      {uiCopy.lineHeight}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReadingLineHeight("normal")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingLineHeight === "normal" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeNormal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingLineHeight("airy")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${readingLineHeight === "airy" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeAiry}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                      {uiCopy.density}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setUiDensity("comfort")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${uiDensity === "comfort" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeComfort}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUiDensity("compact")}
                        className={`px-3 py-2 rounded-xl border text-sm transition-all ${uiDensity === "compact" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                      >
                        {uiCopy.modeCompact}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                  {uiCopy.imageLayout}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageLayout("inline")}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all ${imageLayout === "inline" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                  >
                    {uiCopy.imageInline}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageLayout("float-right")}
                    className={`px-3 py-2 rounded-xl border text-sm transition-all ${imageLayout === "float-right" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300"}`}
                  >
                    {uiCopy.imageFloatRight}
                  </button>
                </div>
              </section>

              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPinQuickFacts((value) => !value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-left transition-all ${pinQuickFacts ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300"}`}
                >
                  {uiCopy.quickFacts}
                </button>
                <button
                  type="button"
                  onClick={() => setFocusMode((value) => !value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-left transition-all ${focusMode ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300"}`}
                >
                  {uiCopy.distractionFree}
                </button>
              </section>
              </div>
            </div>
          </div>,
          document.body
        )}

      {mounted &&
        !isHome &&
        !hideSearch &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-2">
            <button
              type="button"
              onClick={scrollToContents}
              className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-900/85 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-200 backdrop-blur-md"
              title={uiCopy.backToContents}
              aria-label={uiCopy.backToContents}
            >
              <ListTree className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-900/85 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-200 backdrop-blur-md"
              title={uiCopy.scrollTop}
              aria-label={uiCopy.scrollTop}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            {focusMode && (
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="p-3 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800"
                title={uiCopy.exitFocusMode}
                aria-label={uiCopy.exitFocusMode}
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
            {!focusMode && (
              <button
                type="button"
                onClick={() => setFocusMode(true)}
                className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-900/85 border border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-200 backdrop-blur-md"
                title={uiCopy.distractionFree}
                aria-label={uiCopy.distractionFree}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>,
          document.body
        )}

      {mounted &&
        !isHome &&
        !hideSearch &&
        createPortal(
          <div className="fixed top-0 left-0 right-0 z-[115] h-[2px] bg-transparent pointer-events-none">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-[width] duration-150"
              style={{ width: `${readingProgress}%` }}
            />
          </div>,
          document.body
        )}
    </header>
  );
}
