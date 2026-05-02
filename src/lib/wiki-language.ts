export const DEFAULT_WIKI_LANGUAGE = "en";
export const WIKI_LANGUAGE_STORAGE_KEY = "episteme:wikipedia:lang";
export const WIKI_LANGUAGE_COOKIE_NAME = "episteme_wikipedia_lang";

export interface WikiLanguageOption {
  code: string;
  label: string;
}

export const POPULAR_WIKI_LANGUAGES: WikiLanguageOption[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Francais" },
  { code: "es", label: "Espanol" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Portugues" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
];

export function normalizeWikiLanguage(lang?: string) {
  const candidate = (lang ?? "").trim().toLowerCase();
  return /^[a-z][a-z0-9-]{0,14}$/.test(candidate) ? candidate : DEFAULT_WIKI_LANGUAGE;
}

export function readWikiLanguageCookie() {
  if (typeof document === "undefined") return undefined;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${WIKI_LANGUAGE_COOKIE_NAME}=`));

  if (!cookie) return undefined;
  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

export function readPreferredWikiLanguage(search = "") {
  if (typeof window === "undefined") return DEFAULT_WIKI_LANGUAGE;

  const fromUrl = new URLSearchParams(search || window.location.search).get("lang");
  const fromStorage = window.localStorage.getItem(WIKI_LANGUAGE_STORAGE_KEY) ?? undefined;
  const fromCookie = readWikiLanguageCookie();

  return normalizeWikiLanguage(fromUrl ?? fromStorage ?? fromCookie);
}
