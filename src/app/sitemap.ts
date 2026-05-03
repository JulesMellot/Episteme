import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getTrendingTopics } from "@/lib/wikipedia";

export const revalidate = 1800; // 30 minutes

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/wikiwand-alternative"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/wikipedia-reader"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/wiki/search"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    const [enTrending, frTrending] = await Promise.all([
      getTrendingTopics("en", { limit: 10 }),
      getTrendingTopics("fr", { limit: 10 }),
    ]);

    const trendingUrls: MetadataRoute.Sitemap = [];

    for (const topic of enTrending) {
      trendingUrls.push({
        url: absoluteUrl(`/wiki/${encodeURIComponent(topic.title.replace(/ /g, "_"))}?lang=en`),
        lastModified,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }

    for (const topic of frTrending) {
      trendingUrls.push({
        url: absoluteUrl(`/wiki/${encodeURIComponent(topic.title.replace(/ /g, "_"))}?lang=fr`),
        lastModified,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }

    return [...baseUrls, ...trendingUrls];
  } catch {
    return baseUrls;
  }
}
