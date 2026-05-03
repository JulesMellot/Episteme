"use client";

import { useEffect, useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { resolveUiLocale } from "@/lib/wiki-language";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowUpRight,
  Spinner,
  Info,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CornersOut,
  WarningCircle,
  MapTrifold
} from "@phosphor-icons/react";

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

const modalEase = [0.16, 1, 0.3, 1] as const;

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
          resetZoom: "Réinitialiser",
          zoomIn: "Zoomer",
          mediaAlt: "Média",
          unavailablePreview: "Aperçu indisponible",
          description: "Description",
          noDescription: "Aucune description disponible pour ce média.",
          type: "Type",
          dimensions: "Dimensions",
          license: "Licence",
          openOriginal: "Ouvrir l'original",
          openWikiMap: "Ouvrir sur Wikipédia",
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
          resetZoom: "Reset",
          zoomIn: "Zoom in",
          mediaAlt: "Media",
          unavailablePreview: "Preview unavailable",
          description: "Description",
          noDescription: "No description available for this media.",
          type: "Type",
          dimensions: "Dimensions",
          license: "License",
          openOriginal: "Open original",
          openWikiMap: "Open on Wikipedia",
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

  // Motion variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: modalEase } },
  };

  const sidebarVariants = {
    hidden: { opacity: 0, x: 40, scale: 0.98 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: modalEase, staggerChildren: 0.05, delayChildren: 0.1 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: modalEase } }
  };

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-[120] bg-zinc-950/80 backdrop-blur-2xl flex flex-col lg:flex-row"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setState((prev) => ({ ...prev, open: false }));
            }
          }}
        >
          {/* Main Media Area */}
          <div 
            className="absolute inset-0 lg:right-[400px] flex items-center justify-center p-4 lg:p-8"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setState((prev) => ({ ...prev, open: false }));
              }
            }}
          >
            {/* Close button for mobile (absolute top-right) */}
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, open: false }))}
              className="lg:hidden absolute top-4 right-4 z-50 rounded-full bg-zinc-900/60 p-2.5 text-white/70 hover:text-white hover:bg-zinc-800/80 transition-all backdrop-blur-xl border border-white/10 shadow-lg"
              aria-label={uiCopy.close}
            >
              <X weight="bold" className="h-5 w-5" />
            </button>

            {state.loading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 text-white/40"
              >
                <Spinner weight="bold" className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium tracking-wide">{uiCopy.loadingMedia}</span>
              </motion.div>
            ) : state.error ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center gap-5 text-center text-red-400 max-w-md mx-auto p-8 bg-red-950/20 rounded-3xl border border-red-500/20 backdrop-blur-md shadow-2xl"
              >
                <WarningCircle weight="fill" className="w-12 h-12 text-red-500/60" />
                <p className="text-base sm:text-lg">{state.error}</p>
                {state.sourceHref && (
                  <a
                    href={state.sourceHref}
                    className="inline-flex items-center gap-2 rounded-2xl bg-red-500/10 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    {uiCopy.openMediaPage}
                    <ArrowUpRight weight="bold" className="h-4 w-4" />
                  </a>
                )}
              </motion.div>
            ) : state.mode === "map" && state.mapUrl ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full max-w-[1400px] rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/40 shadow-2xl relative"
              >
                <iframe
                  src={state.mapUrl}
                  title={state.title ?? uiCopy.mapFrameTitle}
                  className="w-full h-full absolute inset-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ) : imageSrc ? (
              <TransformWrapper
                initialScale={1}
                minScale={0.2}
                maxScale={8}
                centerZoomedOut={true}
                wheel={{ step: 0.1 }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    {/* Zoom Controls Pill */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-zinc-900/60 backdrop-blur-2xl rounded-full p-1.5 border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                    >
                      <button
                        onClick={() => zoomOut()}
                        className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        aria-label={uiCopy.zoomOut}
                      >
                        <MagnifyingGlassMinus weight="bold" className="w-5 h-5" />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      <button
                        onClick={() => resetTransform()}
                        className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        aria-label={uiCopy.resetZoom}
                      >
                        <CornersOut weight="bold" className="w-5 h-5" />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      <button
                        onClick={() => zoomIn()}
                        className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors active:scale-95"
                        aria-label={uiCopy.zoomIn}
                      >
                        <MagnifyingGlassPlus weight="bold" className="w-5 h-5" />
                      </button>
                    </motion.div>

                    <TransformComponent 
                      wrapperStyle={{ width: "100%", height: "100%" }} 
                      contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <motion.img
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        src={imageSrc}
                        alt={state.data?.title || uiCopy.mediaAlt}
                        className="max-h-[90vh] max-w-[90vw] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-lg cursor-grab active:cursor-grabbing pointer-events-auto"
                      />
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            ) : (
              <div className="text-white/40 text-lg font-medium tracking-tight">{uiCopy.unavailablePreview}</div>
            )}
          </div>

          {/* Glass Sidebar (Right on desktop, bottom sheet on mobile) */}
          {((state.data && state.mode === "file") || (state.mode === "map" && state.mapUrl)) && !state.loading && !state.error && (
            <motion.div 
              variants={sidebarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute bottom-0 left-0 right-0 max-h-[50vh] lg:max-h-none lg:bottom-6 lg:right-6 lg:top-6 lg:left-auto lg:w-[380px] bg-zinc-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-t-[2.5rem] lg:rounded-[2.5rem] flex flex-col pointer-events-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
                <motion.h2 variants={itemVariants} className="text-lg font-semibold text-white tracking-tight leading-snug line-clamp-2 pr-4">
                  {state.data?.title || state.title}
                </motion.h2>
                <motion.button
                  variants={itemVariants}
                  type="button"
                  onClick={() => setState((prev) => ({ ...prev, open: false }))}
                  className="hidden lg:flex shrink-0 rounded-full bg-white/5 p-2 text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  aria-label={uiCopy.close}
                >
                  <X weight="bold" className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 scrollbar-hide">
                {state.mode === "file" && state.data && (
                  <>
                    {/* Description */}
                    <motion.div variants={itemVariants}>
                      <h3 className="text-white/40 font-medium mb-3 flex items-center gap-2 text-xs uppercase tracking-widest">
                        <Info weight="bold" className="w-3.5 h-3.5" />
                        {uiCopy.description}
                      </h3>
                      {state.data.descriptionHtml ? (
                        <div 
                          className="wiki-content prose prose-invert prose-sm max-w-none text-zinc-300 [&_a]:text-white hover:[&_a]:text-zinc-200 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: state.data.descriptionHtml }} 
                        />
                      ) : (
                        <p className="text-zinc-500 italic text-sm">{uiCopy.noDescription}</p>
                      )}
                    </motion.div>

                    {/* Bento Specs */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-1.5">{uiCopy.type}</span>
                        <span className="text-zinc-200 font-mono text-xs truncate block" title={state.data.mime ?? ""}>
                          {state.data.mime?.split('/').pop()?.toUpperCase() ?? "—"}
                        </span>
                      </div>
                      <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest block mb-1.5">{uiCopy.dimensions}</span>
                        <span className="text-zinc-200 font-mono text-xs truncate block">
                          {state.data.width && state.data.height ? `${state.data.width} × ${state.data.height}` : "—"}
                        </span>
                      </div>
                    </motion.div>

                    {/* License */}
                    {state.data.licenseHtml && (
                      <motion.div variants={itemVariants}>
                        <h3 className="text-white/40 font-medium mb-3 text-xs uppercase tracking-widest">
                          {uiCopy.license}
                        </h3>
                        <div className="text-zinc-400 text-xs bg-black/20 rounded-2xl p-4 border border-white/5 prose-a:text-white" dangerouslySetInnerHTML={{ __html: state.data.licenseHtml }} />
                      </motion.div>
                    )}
                  </>
                )}

                {state.mode === "map" && (
                  <motion.div variants={itemVariants} className="flex items-center gap-3 text-zinc-400 text-sm bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                    <MapTrifold weight="duotone" className="w-6 h-6 text-blue-400" />
                    <p>Carte interactive générée via OpenStreetMap pour cet article.</p>
                  </motion.div>
                )}
              </div>

              {/* Action Footer */}
              <motion.div variants={itemVariants} className="p-6 pt-4 border-t border-white/5 bg-zinc-900/40 rounded-b-[2.5rem]">
                {state.mode === "file" && state.data ? (
                  <a
                    href={state.data.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-zinc-900 px-4 py-3.5 text-sm font-semibold transition-all hover:bg-zinc-100 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {uiCopy.openOriginal}
                      <ArrowUpRight weight="bold" className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </a>
                ) : state.mode === "map" && state.sourceHref ? (
                  <a
                    href={state.sourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-white text-zinc-900 px-4 py-3.5 text-sm font-semibold transition-all hover:bg-zinc-100 active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  >
                    {uiCopy.openWikiMap}
                    <ArrowUpRight weight="bold" className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
