export const SITE_NAME = "Episteme";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://episteme.tllm.fr").replace(/\/+$/, "");

export const DEFAULT_SITE_TITLE = "Episteme | Wikiwand Alternative & Wikipedia Reader";
export const DEFAULT_SITE_DESCRIPTION =
  "Episteme is a fast, typography-first Wikipedia reader and an open alternative to Wikiwand.";

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function buildWikiArticleUrl(slug: string, language: string) {
  return absoluteUrl(`/wiki/${encodeURIComponent(slug)}?lang=${encodeURIComponent(language)}`);
}

export function truncateDescription(value: string | null | undefined, maxLength = 160) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return DEFAULT_SITE_DESCRIPTION;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
