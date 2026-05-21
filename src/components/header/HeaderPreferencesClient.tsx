"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ArrowUp, Eye, EyeOff, ListTree, SlidersHorizontal, Type } from "lucide-react";
import { useTheme } from "next-themes";
import { getHeaderUiCopy } from "@/lib/header-ui";

const HeaderDisplaySettingsModal = dynamic(() =>
  import("@/components/header/HeaderDisplaySettingsModal").then((mod) => mod.HeaderDisplaySettingsModal),
  { ssr: false }
);

interface HeaderPreferencesClientProps {
  language: string;
  showFloatingControls?: boolean;
}

function readStoredValue<T extends string>(key: string, allowedValues: readonly T[], fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  return stored && allowedValues.includes(stored as T) ? (stored as T) : fallback;
}

function readStoredToggle(key: string, activeValue = "on") {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(key) === activeValue;
}

export function HeaderPreferencesClient({
  language,
  showFloatingControls = false,
}: HeaderPreferencesClientProps) {
  const { theme, setTheme } = useTheme();
  const [isDisplayModalOpen, setIsDisplayModalOpen] = useState(false);
  const [headingTypography, setHeadingTypography] = useState<"editorial" | "classic">(() =>
    readStoredValue("episteme-heading-typography", ["editorial", "classic"], "editorial")
  );
  const [readingSize, setReadingSize] = useState<"90" | "100" | "110" | "120">(() =>
    readStoredValue("episteme-reading-size", ["90", "100", "110", "120"], "100")
  );
  const [readingWidth, setReadingWidth] = useState<"compact" | "comfort" | "wide">(() =>
    readStoredValue("episteme-reading-width", ["compact", "comfort", "wide"], "comfort")
  );
  const [readingLineHeight, setReadingLineHeight] = useState<"normal" | "airy">(() =>
    readStoredValue("episteme-reading-line-height", ["normal", "airy"], "normal")
  );
  const [uiDensity, setUiDensity] = useState<"comfort" | "compact">(() =>
    readStoredValue("episteme-ui-density", ["comfort", "compact"], "comfort")
  );
  const [focusMode, setFocusMode] = useState<boolean>(() => readStoredToggle("episteme-focus-mode"));
  const [imageLayout, setImageLayout] = useState<"inline" | "float-right">(() =>
    readStoredValue("episteme-image-layout", ["inline", "float-right"], "inline")
  );
  const [pinQuickFacts, setPinQuickFacts] = useState<boolean>(() =>
    readStoredToggle("episteme-pin-quick-facts")
  );
  const uiCopy = getHeaderUiCopy(language);
  const canUseDom = typeof document !== "undefined";

  useEffect(() => {
    document.documentElement.setAttribute("data-typography", headingTypography);
    window.localStorage.setItem("episteme-heading-typography", headingTypography);
  }, [headingTypography]);

  useEffect(() => {
    document.documentElement.setAttribute("data-reading-size", readingSize);
    window.localStorage.setItem("episteme-reading-size", readingSize);
  }, [readingSize]);

  useEffect(() => {
    document.documentElement.setAttribute("data-reading-width", readingWidth);
    window.localStorage.setItem("episteme-reading-width", readingWidth);
  }, [readingWidth]);

  useEffect(() => {
    document.documentElement.setAttribute("data-reading-line-height", readingLineHeight);
    window.localStorage.setItem("episteme-reading-line-height", readingLineHeight);
  }, [readingLineHeight]);

  useEffect(() => {
    document.documentElement.setAttribute("data-ui-density", uiDensity);
    window.localStorage.setItem("episteme-ui-density", uiDensity);
  }, [uiDensity]);

  useEffect(() => {
    document.documentElement.setAttribute("data-image-layout", imageLayout);
    window.localStorage.setItem("episteme-image-layout", imageLayout);
  }, [imageLayout]);

  useEffect(() => {
    document.documentElement.setAttribute("data-focus-mode", focusMode ? "on" : "off");
    window.localStorage.setItem("episteme-focus-mode", focusMode ? "on" : "off");
  }, [focusMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-pin-quick-facts", pinQuickFacts ? "on" : "off");
    window.localStorage.setItem("episteme-pin-quick-facts", pinQuickFacts ? "on" : "off");
  }, [pinQuickFacts]);

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
    <>
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

      {canUseDom && isDisplayModalOpen && (
        <HeaderDisplaySettingsModal
          open={isDisplayModalOpen}
          onClose={() => setIsDisplayModalOpen(false)}
          uiCopy={uiCopy}
          theme={theme}
          setTheme={setTheme}
          headingTypography={headingTypography}
          setHeadingTypography={setHeadingTypography}
          readingSize={readingSize}
          setReadingSize={setReadingSize}
          readingWidth={readingWidth}
          setReadingWidth={setReadingWidth}
          readingLineHeight={readingLineHeight}
          setReadingLineHeight={setReadingLineHeight}
          uiDensity={uiDensity}
          setUiDensity={setUiDensity}
          imageLayout={imageLayout}
          setImageLayout={setImageLayout}
          pinQuickFacts={pinQuickFacts}
          setPinQuickFacts={setPinQuickFacts}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
        />
      )}

      {canUseDom &&
        showFloatingControls &&
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
            {focusMode ? (
              <button
                type="button"
                onClick={() => setFocusMode(false)}
                className="p-3 rounded-2xl bg-zinc-900 text-zinc-100 border border-zinc-800"
                title={uiCopy.exitFocusMode}
                aria-label={uiCopy.exitFocusMode}
              >
                <EyeOff className="w-4 h-4" />
              </button>
            ) : (
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
    </>
  );
}
