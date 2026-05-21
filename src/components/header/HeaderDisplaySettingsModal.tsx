"use client";

import { createPortal } from "react-dom";
import { useEffect } from "react";
import { X } from "lucide-react";
import type { HeaderUiCopy } from "@/lib/header-ui";

interface HeaderDisplaySettingsModalProps {
  open: boolean;
  onClose: () => void;
  uiCopy: HeaderUiCopy;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  headingTypography: "editorial" | "classic";
  setHeadingTypography: (value: "editorial" | "classic") => void;
  readingSize: "90" | "100" | "110" | "120";
  setReadingSize: (value: "90" | "100" | "110" | "120") => void;
  readingWidth: "compact" | "comfort" | "wide";
  setReadingWidth: (value: "compact" | "comfort" | "wide") => void;
  readingLineHeight: "normal" | "airy";
  setReadingLineHeight: (value: "normal" | "airy") => void;
  uiDensity: "comfort" | "compact";
  setUiDensity: (value: "comfort" | "compact") => void;
  imageLayout: "inline" | "float-right";
  setImageLayout: (value: "inline" | "float-right") => void;
  pinQuickFacts: boolean;
  setPinQuickFacts: (value: boolean) => void;
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

export function HeaderDisplaySettingsModal({
  open,
  onClose,
  uiCopy,
  theme,
  setTheme,
  headingTypography,
  setHeadingTypography,
  readingSize,
  setReadingSize,
  readingWidth,
  setReadingWidth,
  readingLineHeight,
  setReadingLineHeight,
  uiDensity,
  setUiDensity,
  imageLayout,
  setImageLayout,
  pinQuickFacts,
  setPinQuickFacts,
  focusMode,
  setFocusMode,
}: HeaderDisplaySettingsModalProps) {
  useEffect(() => {
    if (!open) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] bg-black/45 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
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
            onClick={onClose}
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
                onClick={() => setHeadingTypography("editorial")}
                className={`px-3 py-2 rounded-xl border text-sm transition-all ${headingTypography === "editorial" ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
              >
                {uiCopy.typographyEditorial}
              </button>
              <button
                type="button"
                onClick={() => setHeadingTypography("classic")}
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
              onClick={() => setPinQuickFacts(!pinQuickFacts)}
              className={`w-full px-3 py-2 rounded-xl border text-sm text-left transition-all ${pinQuickFacts ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300"}`}
            >
              {uiCopy.quickFacts}
            </button>
            <button
              type="button"
              onClick={() => setFocusMode(!focusMode)}
              className={`w-full px-3 py-2 rounded-xl border text-sm text-left transition-all ${focusMode ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "border-zinc-200/70 dark:border-zinc-700/70 text-zinc-700 dark:text-zinc-300"}`}
            >
              {uiCopy.distractionFree}
            </button>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}
