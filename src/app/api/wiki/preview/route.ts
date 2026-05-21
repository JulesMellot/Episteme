import { NextRequest, NextResponse } from "next/server";
import { getArticlePreview } from "@/lib/wikipedia";
import { normalizeWikiLanguage } from "@/lib/wiki-language";

const PREVIEW_REVALIDATE_SECONDS = 86400;
const PREVIEW_STALE_SECONDS = 604800;

function toPreviewImageProxyUrl(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      (!parsed.hostname.endsWith(".wikimedia.org") &&
        !parsed.hostname.endsWith(".wikipedia.org"))
    ) {
      return url;
    }

    return `/api/wiki/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return url;
  }
}

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim() ?? "";
  const language = normalizeWikiLanguage(request.nextUrl.searchParams.get("lang") ?? undefined);

  if (!title) {
    return NextResponse.json({ preview: null });
  }

  const preview = await getArticlePreview(title, { language });
  const normalizedPreview = preview
    ? {
        ...preview,
        thumbnailUrl: toPreviewImageProxyUrl(preview.thumbnailUrl),
      }
    : null;

  return NextResponse.json(
    {
      title,
      language,
      preview: normalizedPreview,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${PREVIEW_REVALIDATE_SECONDS}, stale-while-revalidate=${PREVIEW_STALE_SECONDS}`,
      },
    }
  );
}
