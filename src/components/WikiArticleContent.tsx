"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

interface WikiArticleContentProps {
  html: string;
  language: string;
}

interface FloatingPreviewPosition {
  top: number;
  left: number;
  maxWidth: number;
}

interface ReferencePreviewState extends FloatingPreviewPosition {
  kind: "reference";
  html: string;
}

interface ArticlePreviewPayload {
  title: string;
  summary: string | null;
  thumbnailUrl: string | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
}

interface ArticlePreviewState extends FloatingPreviewPosition, ArticlePreviewPayload {
  kind: "article";
  loading: boolean;
}

type PreviewState = ReferencePreviewState | ArticlePreviewState;

interface ArticlePreviewTarget {
  cacheKey: string;
  title: string;
}

const ARTICLE_PREVIEW_NAMESPACE_PATTERN =
  /^(file|image|fichier|special|speciale|spécial|category|categorie|catégorie|template|modele|modèle|user|utilisateur|help|aide|portal|wikipedia|wikipédia|talk|discussion|draft|mediawiki|module|book|timedtext):/i;
const ARTICLE_PREVIEW_BLOCKED_PATHS = new Set(["search", "from-file"]);
const ARTICLE_PREVIEW_TIMEOUT_MS = 2500;
const PREVIEW_VIEWPORT_GAP = 8;
const ENABLE_ARTICLE_LINK_PREVIEWS = false;

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

function buildPreviewPosition(
  anchor: HTMLAnchorElement,
  container: HTMLElement | null,
  {
    preferredWidth = 420,
    minWidth = 260,
  }: {
    preferredWidth?: number;
    minWidth?: number;
  } = {}
): FloatingPreviewPosition {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const containerRect = container?.getBoundingClientRect() ?? null;
  const previewWidth = Math.min(preferredWidth, Math.max(minWidth, viewportWidth - 24));
  const minLeft = Math.max(12, (containerRect?.left ?? 12) + 8);
  const maxLeft = Math.min(
    viewportWidth - previewWidth - 12,
    (containerRect?.right ?? viewportWidth - 12) - previewWidth - 8
  );
  let left = rect.left + rect.width / 2 - previewWidth / 2;
  left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));

  const placeAbove = rect.top > 220;
  // Slight overlap with the anchor avoids a "dead gap" when moving into the preview.
  const top = placeAbove ? rect.top + 4 : rect.bottom - 4;

  return {
    top,
    left,
    maxWidth: previewWidth,
  };
}

function buildReferencePreviewState(
  anchor: HTMLAnchorElement,
  target: HTMLElement,
  container: HTMLElement | null
): ReferencePreviewState | null {
  const html = getReferenceHtml(target);
  if (!html || !normalizeText(target.textContent ?? "")) return null;

  return {
    kind: "reference",
    html,
    ...buildPreviewPosition(anchor, container),
  };
}

function isPreviewableWikiOrigin(url: URL) {
  return (
    url.origin === window.location.origin ||
    /(^|\.)wikipedia\.org$/i.test(url.hostname)
  );
}

function getArticlePreviewTarget(
  anchor: HTMLAnchorElement,
  language: string
): ArticlePreviewTarget | null {
  // Keep the preview pipeline in place, but disable activation for now.
  if (!ENABLE_ARTICLE_LINK_PREVIEWS) return null;

  const rawHref = anchor.getAttribute("href")?.trim();
  if (!rawHref || rawHref.startsWith("#")) return null;

  try {
    const url = new URL(rawHref, window.location.href);
    if (!isPreviewableWikiOrigin(url)) return null;

    if (url.pathname === window.location.pathname && url.hash) return null;
    if (!url.pathname.startsWith("/wiki/")) return null;

    const title = decodeURIComponent(url.pathname.slice("/wiki/".length))
      .replace(/_/g, " ")
      .trim();

    if (!title) return null;
    if (ARTICLE_PREVIEW_BLOCKED_PATHS.has(title.toLowerCase())) return null;
    if (ARTICLE_PREVIEW_NAMESPACE_PATTERN.test(title)) return null;

    return {
      title,
      cacheKey: `${language.toLowerCase()}::${title.toLowerCase()}`,
    };
  } catch {
    return null;
  }
}

export function WikiArticleContent({ html, language }: WikiArticleContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const activeAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const cleanupTimerRef = useRef<number | null>(null);
  const previewRequestRef = useRef(0);
  const previewAbortRef = useRef<AbortController | null>(null);
  const articlePreviewCacheRef = useRef(new Map<string, ArticlePreviewPayload | null>());
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const uiCopy = language.startsWith("fr")
    ? {
        loading: "Chargement...",
        noSummary: "Resume indisponible.",
      }
    : {
        loading: "Loading...",
        noSummary: "Summary unavailable.",
      };

  const clearOriginHighlights = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    root
      .querySelectorAll(".is-reference-origin, .is-link-preview-origin")
      .forEach((node) =>
        node.classList.remove("is-reference-origin", "is-link-preview-origin")
      );
  }, []);

  const cancelPreviewRequest = useCallback(() => {
    previewRequestRef.current += 1;
    if (previewAbortRef.current) {
      previewAbortRef.current.abort();
      previewAbortRef.current = null;
    }
  }, []);

  const hidePreview = useCallback(() => {
    cancelPreviewRequest();
    activeAnchorRef.current = null;
    setPreview(null);
    clearOriginHighlights();
  }, [cancelPreviewRequest, clearOriginHighlights]);

  const isInsideActiveReferenceUi = useCallback((node: Node | null) => {
    if (!node) return false;
    if (activeAnchorRef.current?.contains(node)) return true;
    if (previewRef.current?.contains(node)) return true;
    return false;
  }, []);

  const positionPreviewElement = useCallback(() => {
    const anchor = activeAnchorRef.current;
    const previewElement = previewRef.current;
    if (!anchor || !previewElement) return;

    const anchorRect = anchor.getBoundingClientRect();
    const rootRect = rootRef.current?.getBoundingClientRect() ?? null;
    const previewWidth = previewElement.offsetWidth;
    const previewHeight = previewElement.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const minLeft = Math.max(
      PREVIEW_VIEWPORT_GAP,
      rootRect ? rootRect.left + PREVIEW_VIEWPORT_GAP : PREVIEW_VIEWPORT_GAP
    );
    const maxLeft = Math.min(
      viewportWidth - previewWidth - PREVIEW_VIEWPORT_GAP,
      rootRect
        ? rootRect.right - previewWidth - PREVIEW_VIEWPORT_GAP
        : viewportWidth - previewWidth - PREVIEW_VIEWPORT_GAP
    );

    const anchorMidX = anchorRect.left + anchorRect.width / 2;
    const containerMidX = rootRect
      ? rootRect.left + rootRect.width / 2
      : viewportWidth / 2;

    let left =
      anchorMidX >= containerMidX
        ? anchorRect.right - previewWidth + 12
        : anchorRect.left - 12;
    left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));

    const fitsAbove = anchorRect.top >= previewHeight + PREVIEW_VIEWPORT_GAP;
    const fitsBelow =
      viewportHeight - anchorRect.bottom >= previewHeight + PREVIEW_VIEWPORT_GAP;

    let top: number;
    if (fitsAbove || (!fitsBelow && anchorRect.top > viewportHeight / 2)) {
      top = anchorRect.top - previewHeight + 4;
    } else {
      top = anchorRect.bottom - 4;
    }

    top = Math.max(
      PREVIEW_VIEWPORT_GAP,
      Math.min(top, viewportHeight - previewHeight - PREVIEW_VIEWPORT_GAP)
    );

    previewElement.style.left = `${Math.round(left)}px`;
    previewElement.style.top = `${Math.round(top)}px`;
    previewElement.style.transform = "none";
  }, []);

  useLayoutEffect(() => {
    if (!preview) return;
    positionPreviewElement();
  }, [preview, positionPreviewElement]);

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

    const showReferencePreview = (anchor: HTMLAnchorElement) => {
      const targetId = getHashTargetId(anchor);
      if (!targetId || !/^cite_note-/.test(targetId)) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      const nextPreview = buildReferencePreviewState(anchor, target, root);
      if (!nextPreview) return;

      clearOriginHighlights();
      cancelPreviewRequest();
      activeAnchorRef.current = anchor;
      anchor.classList.add("is-reference-origin");
      setPreview(nextPreview);
    };

    const showArticlePreview = async (anchor: HTMLAnchorElement, target: ArticlePreviewTarget) => {
      clearOriginHighlights();
      activeAnchorRef.current = anchor;
      anchor.classList.add("is-link-preview-origin");

      const initialPosition = buildPreviewPosition(anchor, root, {
        preferredWidth: 460,
        minWidth: 300,
      });

      const cachedPreview = articlePreviewCacheRef.current.get(target.cacheKey);
      if (cachedPreview !== undefined) {
        if (!cachedPreview) {
          hidePreview();
          return;
        }

        setPreview({
          kind: "article",
          loading: false,
          ...cachedPreview,
          ...initialPosition,
        });
        return;
      }

      cancelPreviewRequest();
      const controller = new AbortController();
      previewAbortRef.current = controller;
      const requestId = previewRequestRef.current;
      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, ARTICLE_PREVIEW_TIMEOUT_MS);

      setPreview({
        kind: "article",
        loading: true,
        title: target.title,
        summary: null,
        thumbnailUrl: null,
        thumbnailWidth: null,
        thumbnailHeight: null,
        ...initialPosition,
      });

      try {
        const params = new URLSearchParams({
          title: target.title,
          lang: language,
        });
        const response = await fetch(`/api/wiki/preview?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
          cache: "force-cache",
        });

        if (!response.ok) {
          hidePreview();
          return;
        }

        const data = (await response.json()) as {
          preview?: ArticlePreviewPayload | null;
        };
        const nextPreview = data.preview ?? null;
        articlePreviewCacheRef.current.set(target.cacheKey, nextPreview);

        if (
          !nextPreview ||
          requestId !== previewRequestRef.current ||
          activeAnchorRef.current !== anchor
        ) {
          if (!nextPreview && activeAnchorRef.current === anchor) {
            hidePreview();
          }
          return;
        }

        setPreview({
          kind: "article",
          loading: false,
          ...nextPreview,
          ...buildPreviewPosition(anchor, root, {
            preferredWidth: 460,
            minWidth: 300,
          }),
        });
      } catch (error) {
        if ((error as DOMException)?.name === "AbortError") {
          if (activeAnchorRef.current === anchor) {
            hidePreview();
          }
          return;
        }

        if (activeAnchorRef.current === anchor) {
          hidePreview();
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (previewAbortRef.current === controller) {
          previewAbortRef.current = null;
        }
      }
    };

    const onMouseOver = (event: MouseEvent) => {
      if (!hoverMedia.matches) return;

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!(anchor instanceof HTMLAnchorElement) || !root.contains(anchor)) return;
      if (activeAnchorRef.current === anchor) return;

      if (isCitationAnchor(anchor)) {
        showReferencePreview(anchor);
        return;
      }

      const articleTarget = getArticlePreviewTarget(anchor, language);
      if (!articleTarget) return;
      void showArticlePreview(anchor, articleTarget);
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
      if (activeAnchorRef.current === anchor) return;

      if (isCitationAnchor(anchor)) {
        showReferencePreview(anchor);
        return;
      }

      const articleTarget = getArticlePreviewTarget(anchor, language);
      if (!articleTarget) return;
      void showArticlePreview(anchor, articleTarget);
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
        showReferencePreview(anchor);
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
      cancelPreviewRequest();
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
  }, [
    html,
    language,
    cancelPreviewRequest,
    clearOriginHighlights,
    hidePreview,
    isInsideActiveReferenceUi,
  ]);

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
          className={
            preview.kind === "article"
              ? "wiki-reference-preview wiki-reference-preview--article"
              : "wiki-reference-preview"
          }
          style={{
            top: preview.top,
            left: preview.left,
            maxWidth: preview.maxWidth,
          }}
          role={preview.kind === "article" ? "tooltip" : "note"}
          aria-live="polite"
          onBlur={(event) => {
            const next = event.relatedTarget as Node | null;
            if (isInsideActiveReferenceUi(next)) return;
            hidePreview();
          }}
        >
          {preview.kind === "reference" ? (
            <div
              className="wiki-reference-preview__text"
              dangerouslySetInnerHTML={{ __html: preview.html }}
            />
          ) : (
            <div className="wiki-link-preview">
              {preview.thumbnailUrl ? (
                <Image
                  src={preview.thumbnailUrl}
                  alt={preview.title}
                  width={preview.thumbnailWidth ?? 640}
                  height={preview.thumbnailHeight ?? 360}
                  sizes="(max-width: 640px) min(100vw - 24px, 460px), 460px"
                  className="wiki-link-preview__image"
                />
              ) : null}
              <div className="wiki-link-preview__body">
                <div className="wiki-link-preview__title">{preview.title}</div>
                <p className="wiki-link-preview__summary">
                  {preview.loading
                    ? uiCopy.loading
                    : preview.summary || uiCopy.noSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
