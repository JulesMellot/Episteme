export interface WikiMediaModalRequest {
  mode: "file" | "map";
  title: string;
  sourceHref: string;
  mapUrl: string | null;
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

export function extractModalTargetFromHref(
  href: string,
  language: string,
  currentUrl: string
): WikiMediaModalRequest | null {
  try {
    const url = new URL(href, currentUrl);
    const pathname = url.pathname;
    if (!pathname.startsWith("/wiki/")) return null;

    const wikiTitle = decodeURIComponent(pathname.slice("/wiki/".length)).replace(/_/g, " ").trim();
    const normalized = normalizeMediaTitle(wikiTitle);

    if (/^(file|image|fichier):/i.test(wikiTitle)) {
      return {
        mode: "file",
        title: normalized,
        sourceHref: url.toString(),
        mapUrl: null,
      };
    }

    if (/^(special|spécial):map(\/|$)/i.test(wikiTitle)) {
      const mapParams = parseSpecialMapPath(wikiTitle);
      const wikipediaMapUrl = new URL(
        `${url.pathname}${url.search}${url.hash}`,
        `https://${language}.wikipedia.org`
      ).toString();

      return {
        mode: "map",
        title: "Wikipedia Map",
        sourceHref: wikipediaMapUrl,
        mapUrl: mapParams ? createOsmEmbedUrl(mapParams) : null,
      };
    }

    return null;
  } catch {
    return null;
  }
}
