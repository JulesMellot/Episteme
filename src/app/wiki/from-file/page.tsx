import { cookies } from "next/headers";
import type { Metadata } from "next";
import { WikiFromFilePageClient } from "@/components/WikiFromFilePageClient";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Open a Wikipedia Article From a File",
  description: "Open a Wikipedia article from a title or URL stored in a text file.",
  alternates: {
    canonical: absoluteUrl("/wiki/from-file"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WikiFromFilePage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const initialLanguage = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_WIKI_LANGUAGE
  );

  return <WikiFromFilePageClient initialLanguage={initialLanguage} />;
}
