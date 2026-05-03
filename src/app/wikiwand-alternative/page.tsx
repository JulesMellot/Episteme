import { cookies } from "next/headers";
import type { Metadata } from "next";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, resolveUiLocale, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import { absoluteUrl } from "@/lib/site";
import { WikiwandAlternativeClient } from "@/components/WikiwandAlternativeClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const language = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_WIKI_LANGUAGE
  );
  const uiLocale = resolveUiLocale(language);

  const title = uiLocale === "fr" 
    ? "Alternative à Wikiwand : Episteme, le lecteur Wikipédia minimaliste" 
    : "Wikiwand Alternative: Episteme, the minimal Wikipedia reader";
    
  const description = uiLocale === "fr"
    ? "Vous cherchez une alternative à Wikiwand ? Episteme est un lecteur Wikipédia rapide, centré sur la typographie, avec une interface plus claire et sans publicité."
    : "Looking for a Wikiwand alternative? Episteme is a fast, typography-first Wikipedia reader with a cleaner interface and no ads.";

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl("/wikiwand-alternative"),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/wikiwand-alternative"),
      type: "website",
    },
  };
}

export default async function WikiwandAlternativePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const initialLanguage = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_WIKI_LANGUAGE
  );

  return <WikiwandAlternativeClient initialLanguage={initialLanguage} />;
}
