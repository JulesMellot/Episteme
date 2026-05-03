import { cookies } from "next/headers";
import type { Metadata } from "next";
import { HomePageClient } from "@/components/HomePageClient";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, WIKI_LANGUAGE_COOKIE_NAME } from "@/lib/wiki-language";
import {
  absoluteUrl,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  SITE_NAME,
} from "@/lib/site";
import { getTrendingTopics } from "@/lib/wikipedia";

export const metadata: Metadata = {
  title: DEFAULT_SITE_TITLE,
  description: DEFAULT_SITE_DESCRIPTION,
  keywords: [
    "Wikiwand alternative",
    "alternative to Wikiwand",
    "alternative a Wikiwand",
    "Wikipedia reader",
    "lecteur Wikipedia",
    "lecteur de Wikipedia",
    "Wikipedia reader app",
    "Episteme",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}) {
  const { lang } = await searchParams;
  const cookieStore = await cookies();
  const initialLanguage = normalizeWikiLanguage(
    (Array.isArray(lang) ? lang[0] : lang) ?? cookieStore.get(WIKI_LANGUAGE_COOKIE_NAME)?.value ?? DEFAULT_WIKI_LANGUAGE
  );
  const trendingTopics = await getTrendingTopics(initialLanguage, { limit: 6 });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: DEFAULT_SITE_DESCRIPTION,
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/wiki/search")}?q={search_term_string}&lang=${initialLanguage}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/"),
        description: DEFAULT_SITE_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is Episteme an alternative to Wikiwand?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Episteme is a fast, typography-first Wikiwand alternative built for a cleaner Wikipedia reading experience.",
            },
          },
          {
            "@type": "Question",
            name: "Is Episteme a Wikipedia reader?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Episteme is a Wikipedia reader focused on readability, performance, multilingual access, and reduced visual noise.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageClient initialLanguage={initialLanguage} trendingTopics={trendingTopics} />
    </>
  );
}
