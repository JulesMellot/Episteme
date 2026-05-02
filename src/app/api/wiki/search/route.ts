import { NextRequest, NextResponse } from "next/server";
import { searchWikipedia } from "@/lib/wikipedia";
import { normalizeWikiLanguage } from "@/lib/wiki-language";

const MIN_QUERY_LENGTH = 2;
const MAX_LIMIT = 8;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const language = normalizeWikiLanguage(request.nextUrl.searchParams.get("lang") ?? undefined);
  const limitParam = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 6;

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      results: [],
      minQueryLength: MIN_QUERY_LENGTH,
    });
  }

  const results = await searchWikipedia(query, {
    language,
    limit,
  });

  return NextResponse.json({
    query,
    language,
    results,
  });
}
