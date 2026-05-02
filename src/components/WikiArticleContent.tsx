"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface WikiArticleContentProps {
  html: string;
  language: string;
}

interface ReferencePreviewState {
  html: string;
  top: number;
  left: number;
  maxWidth: number;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getHashTargetId(anchor: HTMLAnchorElement) {
  const rawHref = anchor.getAttribute("href")?.trim();
  if (!rawHref) return null;

  try {
    const url = new URL(rawHref, window.location.href);
    const hash = url.hash.replace(/^#/, "").trim();
    return hash || null;
  } catch {
    if (!rawHref.startsWith("#")) return null;
    return rawHref.slice(1).trim() || null;
  }
}

function isCitationAnchor(anchor: HTMLAnchorElement) {
  const targetId = getHashTargetId(anchor);
  return Boolean(targetId && /^cite_note-/.test(targetId));
}

function isBacklinkAnchor(anchor: HTMLAnchorElement) {
  const targetId = getHashTargetId(anchor);
  return Boolean(targetId && /^cite_ref-/.test(targetId));
}

function getReferenceHtml(target: HTMLElement) {
  const textNode =
    target.querySelector<HTMLElement>(".mw-reference-text, .reference-text") ?? target;
  const cloned = textNode.cloneNode(true) as HTMLElement;
  cloned
    .querySelectorAll(".mw-cite-backlink, .mw-linkback-text, .reference")
    .forEach((node) => node.remove());
  cloned.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  return cloned.innerHTML.trim();
}

function buildPreviewState(anchor: HTMLAnchorElement, target: HTMLElement): ReferencePreviewState | null {
  const html = getReferenceHtml(target);
  if (!html || !normalizeText(target.textContent ?? "")) return null;

  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const previewWidth = Math.min(420, Math.max(260, viewportWidth - 24));
  let left = rect.left + rect.width / 2 - previewWidth / 2;
  left = Math.max(12, Math.min(left, viewportWidth - previewWidth - 12));

  const placeAbove = rect.top > 220;
  // Slight overlap with the anchor avoids a "dead gap" when moving into the preview.
  const top = placeAbove ? rect.top + 4 : rect.bottom - 4;

  return {
    html,
    top,
    left,
    maxWidth: previewWidth,
  };
}

export function WikiArticleContent({ html, language }: WikiArticleContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const activeAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const [preview, setPreview] = useState<ReferencePreviewState | null>(null);

  const clearOriginHighlights = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    root
      .querySelectorAll(".is-reference-origin")
      .forEach((node) => node.classList.remove("is-reference-origin"));
  }, []);

  const hidePreview = useCallback(() => {
    activeAnchorRef.current = null;
    setPreview(null);
    clearOriginHighlights();
  }, [clearOriginHighlights]);

  const isInsideActiveReferenceUi = useCallback((node: Node | null) => {
    if (!node) return false;
    if (activeAnchorRef.current?.contains(node)) return true;
    if (previewRef.current?.contains(node)) return true;
    return false;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const hoverMedia = window.matchMedia("(hover: hover)");

    const clearScheduledCleanup = () => {
      if (cleanupTimerRef.current !== null) {
        window.clearTimeout(cleanupTimerRef.current);
        cleanupTimerRef.current = null;
      }
    };

    const clearHighlights = () => {
      root
        .querySelectorAll(".is-reference-origin, .is-reference-target")
        .forEach((node) =>
          node.classList.remove("is-reference-origin", "is-reference-target")
        );
    };

    const scheduleHighlightCleanup = () => {
      clearScheduledCleanup();
      cleanupTimerRef.current = window.setTimeout(() => {
        clearHighlights();
        cleanupTimerRef.current = null;
      }, 2200);
    };

    const showPreview = (anchor: HTMLAnchorElement) => {
      const targetId = getHashTargetId(anchor);
      if (!targetId || !/^cite_note-/.test(targetId)) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      const nextPreview = buildPreviewState(anchor, target);
      if (!nextPreview) return;

      clearOriginHighlights();
      activeAnchorRef.current = anchor;
      anchor.classList.add("is-reference-origin");
      setPreview(nextPreview);
    };

    const onMouseOver = (event: MouseEvent) => {
      if (!hoverMedia.matches) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !root.contains(anchor)) return;
      if (!isCitationAnchor(anchor)) return;

      showPreview(anchor);
    };

    const onPointerMoveDocument = (event: PointerEvent) => {
      if (!hoverMedia.matches) return;
      if (!activeAnchorRef.current || !previewRef.current) return;
      if (isInsideActiveReferenceUi(event.target as Node | null)) return;
      hidePreview();
    };

    const onFocusIn = (event: FocusEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !root.contains(anchor)) return;
      if (!isCitationAnchor(anchor)) return;

      showPreview(anchor);
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (isInsideActiveReferenceUi(next)) return;
      hidePreview();
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !root.contains(anchor)) return;

      const targetId = getHashTargetId(anchor);
      if (!targetId || !/^(cite_note-|cite_ref-)/.test(targetId)) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      event.preventDefault();
      clearHighlights();

      anchor.classList.add("is-reference-origin");
      target.classList.add("is-reference-target");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      window.history.replaceState(null, "", `#${targetId}`);

      if (isCitationAnchor(anchor)) {
        showPreview(anchor);
      } else if (isBacklinkAnchor(anchor)) {
        hidePreview();
      }

      scheduleHighlightCleanup();
    };

    const onPointerDownDocument = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (isInsideActiveReferenceUi(target)) return;
      hidePreview();
    };

    const onPointerLeaveDocument = () => {
      hidePreview();
    };

    const onScrollOrResize = () => {
      hidePreview();
    };

    root.addEventListener("mouseover", onMouseOver);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    root.addEventListener("click", onClick);
    document.addEventListener("pointermove", onPointerMoveDocument);
    document.addEventListener("pointerdown", onPointerDownDocument);
    document.addEventListener("pointerleave", onPointerLeaveDocument);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      clearScheduledCleanup();
      root.removeEventListener("mouseover", onMouseOver);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      root.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onPointerMoveDocument);
      document.removeEventListener("pointerdown", onPointerDownDocument);
      document.removeEventListener("pointerleave", onPointerLeaveDocument);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [html, clearOriginHighlights, hidePreview, isInsideActiveReferenceUi]);

  return (
    <>
      <div
        ref={rootRef}
        className="wiki-content relative w-full max-w-full"
        data-language={language}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {preview && (
        <div
          ref={previewRef}
          className="wiki-reference-preview"
          style={{
            top: preview.top,
            left: preview.left,
            maxWidth: preview.maxWidth,
            transform: preview.top > 200 ? "translateY(-100%)" : undefined,
          }}
          role="note"
          aria-live="polite"
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (isInsideActiveReferenceUi(next)) return;
            hidePreview();
          }}
        >
          <div
            className="wiki-reference-preview__text"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </div>
      )}
    </>
  );
}
