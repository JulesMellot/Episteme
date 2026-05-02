import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/wikipedia";
import { normalizeWikiLanguage } from "@/lib/wiki-language";

function normalizeFileQueryTitle(title: string) {
  const cleaned = title.replace(/_/g, " ").trim();
  if (/^fichier:/i.test(cleaned)) return `File:${cleaned.slice("Fichier:".length)}`;
  if (/^image:/i.test(cleaned)) return `File:${cleaned.slice("Image:".length)}`;
  if (/^file:/i.test(cleaned)) return `File:${cleaned.slice("File:".length)}`;
  return cleaned;
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

async function getFileViaActionApi(title: string, lang: string) {
  const api = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  api.searchParams.set("action", "query");
  api.searchParams.set("titles", title);
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|mime|size|extmetadata");
  api.searchParams.set("iiurlwidth", "1200");
  api.searchParams.set("redirects", "1");
  api.searchParams.set("format", "json");
  api.searchParams.set("formatversion", "2");

  const res = await fetch(api, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    query?: {
      pages?: Array<{
        title?: string;
        missing?: boolean;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          mime?: string;
          width?: number;
          height?: number;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }>;
    };
  };

  const page = data.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;

  const ext = info.extmetadata ?? {};
  const descriptionHtml = null;
  const licenseHtml = null;
  const descriptionText = ext.ImageDescription?.value ? stripHtml(ext.ImageDescription.value) : null;

  return {
    title: page?.title ?? title,
    fileUrl: info.url,
    thumbUrl: info.thumburl ?? info.url,
    mime: info.mime ?? null,
    width: typeof info.width === "number" ? info.width : null,
    height: typeof info.height === "number" ? info.height : null,
    summary: descriptionText,
    descriptionHtml,
    licenseHtml,
  };
}

export async function GET(request: NextRequest) {
  const rawTitle = request.nextUrl.searchParams.get("title")?.trim();
  const lang = normalizeWikiLanguage(request.nextUrl.searchParams.get("lang") ?? undefined);

  if (!rawTitle) {
    return NextResponse.json({ error: "Missing `title` parameter." }, { status: 400 });
  }

  const title = normalizeFileQueryTitle(rawTitle);
  const file = (await getFile(title, 2, lang)) ?? (await getFileViaActionApi(title, lang));
  if (!file?.fileUrl) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.json({
    title: file.title,
    fileUrl: file.fileUrl,
    thumbUrl: file.thumbUrl,
    mime: file.mime,
    width: file.width,
    height: file.height,
    summary: file.summary,
    descriptionHtml: file.descriptionHtml,
    licenseHtml: file.licenseHtml,
  });
}
