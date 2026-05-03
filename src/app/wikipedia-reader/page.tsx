import { cookies } from "next/headers";
import type { Metadata } from "next";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, resolveUiLocale, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import { absoluteUrl } from "@/lib/site";
import { WikipediaReaderClient } from "@/components/WikipediaReaderClient";

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
    ? "Lecteur Wikipédia : Lisez mieux avec Episteme" 
    : "Wikipedia Reader: A Better Way to Read";
    
  const description = uiLocale === "fr"
    ? "Episteme est un lecteur Wikipédia moderne. Thème sombre, typographie optimisée, et mise en page épurée pour une lecture confortable de l'encyclopédie."
    : "Episteme is a modern Wikipedia reader app. Dark mode, optimized typography, and a clean layout for a comfortable reading experience.";

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl("/wikipedia-reader"),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/wikipedia-reader"),
      type: "website",
    },
  };
}

export default async function WikipediaReaderPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const initialLanguage = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_WIKI_LANGUAGE
  );

  return <WikipediaReaderClient initialLanguage={initialLanguage} />;
}
