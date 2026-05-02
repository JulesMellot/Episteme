"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ExternalLink, Loader2, Info, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { resolveUiLocale } from "@/lib/wiki-language";

interface WikiMediaModalProps {
  language: string;
}

interface MediaFilePayload {
  title: string;
  fileUrl: string;
  thumbUrl: string | null;
  mime: string | null;
  width: number | null;
  height: number | null;
  summary: string | null;
  descriptionHtml: string | null;
  licenseHtml: string | null;
}

interface ModalState {
  open: boolean;
  loading: boolean;
  error: string | null;
  sourceHref: string | null;
  mode: "file" | "map" | null;
  title: string | null;
  mapUrl: string | null;
  data: MediaFilePayload | null;
}

function normalizeMediaTitle(rawTitle: string) {
  const cleaned = rawTitle.replace(/_/g, " ").trim();
  if (/^fichier:/i.test(cleaned)) return `File:${cleaned.slice("Fichier:".length)}`;
  if (/^image:/i.test(cleaned)) return `File:${cleaned.slice("Image:".length)}`;
  return cleaned;
}

function parseSpecialMapPath(wikiTitle: string) {
  const normalized = wikiTitle.replace(/^spécial:/i, "Special:");
  const match = normalized.match(/^Special:Map\/(\d+)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)(?:\/[^/]+)?$/i);
  if (!match) return null;

  const zoom = Number(match[1]);
  const lat = Number(match[2]);
  const lon = Number(match[3]);

  if (!Number.isFinite(zoom) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (zoom < 0 || zoom > 19) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;

  return { zoom, lat, lon };
}

function createOsmEmbedUrl({ zoom, lat, lon }: { zoom: number; lat: number; lon: number }) {
  const lonDelta = Math.max(360 / 2 ** zoom, 0.01);
  const latDelta = Math.max(170 / 2 ** zoom, 0.01);
  const minLon = Math.max(-180, lon - lonDelta);
  const maxLon = Math.min(180, lon + lonDelta);
  const minLat = Math.max(-90, lat - latDelta);
  const maxLat = Math.min(90, lat + latDelta);
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  const marker = `${lat},${lon}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
}

function extractModalTargetFromHref(href: string, language: string) {
  try {
    const url = new URL(href, window.location.href);
    const pathname = url.pathname;
    if (!pathname.startsWith("/wiki/")) return null;
    const wikiTitle = decodeURIComponent(pathname.slice("/wiki/".length)).replace(/_/g, " ").trim();
    const normalized = normalizeMediaTitle(wikiTitle);

    if (/^(file|image|fichier):/i.test(wikiTitle)) {
      return {
        mode: "file" as const,
        title: normalized,
      };
    }

    if (/^(special|spécial):map(\/|$)/i.test(wikiTitle)) {
      const mapParams = parseSpecialMapPath(wikiTitle);
      const wikipediaMapUrl = new URL(
        `${url.pathname}${url.search}${url.hash}`,
        `https://${language}.wikipedia.org`
      ).toString();

      return {
        mode: "map" as const,
        title: "Wikipedia Map",
        mapUrl: mapParams ? createOsmEmbedUrl(mapParams) : null,
        sourceHref: wikipediaMapUrl,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function WikiMediaModal({ language }: WikiMediaModalProps) {
  const [state, setState] = useState<ModalState>({
    open: false,
    loading: false,
    error: null,
    sourceHref: null,
    mode: null,
    title: null,
    mapUrl: null,
    data: null,
  });

  const imageSrc = useMemo(() => state.data?.thumbUrl ?? state.data?.fileUrl ?? null, [state.data]);
  const uiLocale = resolveUiLocale(language);
  const uiCopy =
    uiLocale === "fr"
      ? {
          mapTitle: "Carte Wikipédia",
          loadError: "Impossible de charger ce média pour le moment.",
          loading: "Chargement...",
          close: "Fermer",
          loadingMedia: "Chargement du média...",
          openMediaPage: "Ouvrir la page média",
          mapFrameTitle: "Carte Wikipédia",
          zoomOut: "Dézoomer",
          resetZoom: "Réinitialiser le zoom",
          zoomIn: "Zoomer",
          mediaAlt: "Média",
          unavailablePreview: "Aperçu indisponible",
          description: "Description",
          noDescription: "Aucune description disponible pour ce média.",
          type: "Type",
          dimensions: "Dimensions",
          license: "Licence",
          openOriginal: "Ouvrir le fichier original",
          openWikiMap: "Ouvrir la carte sur Wikipédia",
        }
      : {
          mapTitle: "Wikipedia Map",
          loadError: "Unable to load this media right now.",
          loading: "Loading...",
          close: "Close",
          loadingMedia: "Loading media...",
          openMediaPage: "Open media page",
          mapFrameTitle: "Wikipedia Map",
          zoomOut: "Zoom out",
          resetZoom: "Reset zoom",
          zoomIn: "Zoom in",
          mediaAlt: "Media",
          unavailablePreview: "Preview unavailable",
          description: "Description",
          noDescription: "No description available for this media.",
          type: "Type",
          dimensions: "Dimensions",
          license: "License",
          openOriginal: "Open original file",
          openWikiMap: "Open map on Wikipedia",
        };

  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!anchor.closest(".wiki-content, .wiki-infobox")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const modalTarget = extractModalTargetFromHref(href, language);
      if (!modalTarget) return;

      event.preventDefault();
      event.stopPropagation();

      if (modalTarget.mode === "map") {
        setState({
          open: true,
          loading: false,
          error: null,
          sourceHref: modalTarget.sourceHref ?? href,
          mode: "map",
          title: modalTarget.title ?? uiCopy.mapTitle,
          mapUrl: modalTarget.mapUrl,
          data: null,
        });
        return;
      }

      setState({
        open: true,
        loading: true,
        error: null,
        sourceHref: href,
        mode: "file",
        title: modalTarget.title,
        mapUrl: null,
        data: null,
      });

      try {
        const params = new URLSearchParams({
          title: modalTarget.title,
          lang: language,
        });
        const response = await fetch(`/api/wiki/file?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = (await response.json()) as MediaFilePayload;
        setState({
          open: true,
          loading: false,
          error: null,
          sourceHref: href,
          mode: "file",
          title: payload.title,
          mapUrl: null,
          data: payload,
        });
      } catch {
        setState({
          open: true,
          loading: false,
          error: uiCopy.loadError,
          sourceHref: href,
          mode: "file",
          title: modalTarget.title,
          mapUrl: null,
          data: null,
        });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [language, uiCopy.loadError, uiCopy.mapTitle]);

  useEffect(() => {
    if (!state.open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setState((prev) => ({ ...prev, open: false }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state.open]);

  if (!state.open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setState((prev) => ({ ...prev, open: false }));
        }
      }}
    >
      {/* Top Bar (Absolute to maximize image space) */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        <h2 className="text-lg sm:text-xl font-semibold text-white drop-shadow-md line-clamp-2 max-w-[80%] pointer-events-auto">
          {state.data?.title || state.title || (state.loading ? uiCopy.loading : "")}
        </h2>
        <button
          type="button"
          onClick={() => setState((prev) => ({ ...prev, open: false }))}
          className="rounded-full bg-black/50 p-2 sm:p-2.5 text-white/70 hover:text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg"
          aria-label={uiCopy.close}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      </div>

      {/* Main Image Area */}
      <div 
        className="flex-1 min-h-0 relative flex items-center justify-center p-4 sm:p-8"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setState((prev) => ({ ...prev, open: false }));
          }
        }}
      >
        {state.loading ? (
          <div className="flex flex-col items-center gap-4 text-white/50">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-sm font-medium tracking-wide">{uiCopy.loadingMedia}</span>
          </div>
        ) : state.error ? (
          <div className="flex flex-col items-center justify-center gap-5 text-center text-red-400 max-w-md mx-auto p-6 bg-red-950/30 rounded-2xl border border-red-500/20 backdrop-blur-sm">
            <p className="text-base sm:text-lg">{state.error}</p>
            {state.sourceHref && (
              <a
                href={state.sourceHref}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/30 transition-colors"
              >
                {uiCopy.openMediaPage}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        ) : state.mode === "map" && state.mapUrl ? (
          <div className="w-full h-full max-w-[1400px] max-h-[80vh] rounded-2xl overflow-hidden border border-white/15 bg-black/30 shadow-2xl">
            <iframe
              src={state.mapUrl}
              title={state.title ?? uiCopy.mapFrameTitle}
              className="w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : imageSrc ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.2}
            maxScale={8}
            centerZoomedOut={true}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div className="absolute right-4 bottom-4 z-20 flex gap-2 pointer-events-auto bg-black/50 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-lg">
                  <button
                    onClick={() => zoomOut()}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label={uiCopy.zoomOut}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label={uiCopy.resetZoom}
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => zoomIn()}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    aria-label={uiCopy.zoomIn}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                </div>
                <TransformComponent 
                  wrapperStyle={{ width: "100%", height: "100%" }} 
                  contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageSrc}
                    alt={state.data?.title || uiCopy.mediaAlt}
                    className="max-h-full max-w-full object-contain drop-shadow-2xl rounded-sm cursor-grab active:cursor-grabbing pointer-events-auto"
                    onMouseDown={(e) => {
                      // Prevent modal close when interacting with image
                      e.stopPropagation();
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div className="text-white/40 text-lg">{uiCopy.unavailablePreview}</div>
        )}
      </div>

      {/* Bottom Metadata Panel */}
      {state.data && state.mode === "file" && !state.loading && !state.error && (
        <div className="flex-none bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 p-5 sm:p-8 overflow-y-auto max-h-[45vh] md:max-h-[35vh]">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-8 md:gap-16">
            {/* Description */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white/90 font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info className="w-4 h-4 text-white/50" />
                {uiCopy.description}
              </h3>
              {state.data.descriptionHtml ? (
                <div 
                  className="wiki-content prose prose-invert prose-sm max-w-none text-zinc-300 [&_a]:text-blue-400 hover:[&_a]:text-blue-300"
                  dangerouslySetInnerHTML={{ __html: state.data.descriptionHtml }} 
                />
              ) : (
                <p className="text-zinc-500 italic text-sm">{uiCopy.noDescription}</p>
              )}
            </div>

            {/* Meta details */}
            <div className="md:w-80 flex-none space-y-6 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-zinc-400">{uiCopy.type}</span>
                  <span className="text-zinc-200 font-mono text-xs bg-white/5 px-2 py-1 rounded-md">{state.data.mime ?? "—"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-zinc-400">{uiCopy.dimensions}</span>
                  <span className="text-zinc-200 font-mono text-xs bg-white/5 px-2 py-1 rounded-md">
                    {state.data.width && state.data.height ? `${state.data.width} × ${state.data.height}` : "—"}
                  </span>
                </div>
              </div>
              
              {state.data.licenseHtml && (
                <div>
                  <div className="text-zinc-400 mb-2 font-medium">{uiCopy.license}</div>
                  <div className="text-zinc-400 text-xs bg-black/40 rounded-xl p-4 border border-white/5" dangerouslySetInnerHTML={{ __html: state.data.licenseHtml }} />
                </div>
              )}

              <div className="pt-2">
                <a
                  href={state.data.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-3 font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  {uiCopy.openOriginal}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {state.mode === "map" && state.mapUrl && !state.loading && !state.error && (
        <div className="flex-none bg-zinc-950/90 backdrop-blur-2xl border-t border-white/10 p-5 sm:p-6">
          <div className="max-w-[1400px] mx-auto flex justify-end">
            <a
              href={state.sourceHref ?? state.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2.5 font-semibold hover:bg-zinc-200 transition-colors"
            >
              {uiCopy.openWikiMap}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
