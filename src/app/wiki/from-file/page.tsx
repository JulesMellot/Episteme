"use client";

import { Header } from "@/components/Header";
import { ArrowRight, FileText, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage, readPreferredWikiLanguage } from "@/lib/wiki-language";

interface ParsedWikipediaInput {
  title: string;
  language: string;
}

function extractWikipediaInput(input: string, fallbackLanguage: string): ParsedWikipediaInput | null {
  const raw = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!raw) return null;

  const extractFromPath = (pathname: string): string | null => {
    const wikiPrefix = "/wiki/";
    const restPrefix = "/api/rest_v1/page/html/";

    const stripQueryAndHash = (v: string) => v.split(/[?#]/)[0] ?? v;

    if (pathname.startsWith(wikiPrefix)) {
      const title = decodeURIComponent(stripQueryAndHash(pathname).slice(wikiPrefix.length));
      return title.replace(/_/g, " ").trim() || null;
    }

    if (pathname.startsWith(restPrefix)) {
      const title = decodeURIComponent(stripQueryAndHash(pathname).slice(restPrefix.length));
      return title.replace(/_/g, " ").trim() || null;
    }

    return null;
  };

  const tryParseUrl = (value: string): URL | null => {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  };

  const url = tryParseUrl(raw);
  if (url) {
    const hostMatch = url.hostname.toLowerCase().match(/^([a-z][a-z0-9-]{0,14})\.wikipedia\.org$/);
    if (!hostMatch) return null;
    const title = extractFromPath(url.pathname);
    if (!title) return null;
    return { title, language: normalizeWikiLanguage(hostMatch[1]) };
  }

  const schemeLessUrlMatch = raw.match(/^(?:https?:\/\/)?([a-z][a-z0-9-]{0,14})\.wikipedia\.org(\/.*)$/i);
  if (schemeLessUrlMatch?.[2]) {
    const title = extractFromPath(schemeLessUrlMatch[2]);
    if (!title) return null;
    return { title, language: normalizeWikiLanguage(schemeLessUrlMatch[1]) };
  }

  if (raw.startsWith("/wiki/") || raw.startsWith("/api/rest_v1/page/html/")) {
    const title = extractFromPath(raw);
    if (!title) return null;
    return { title, language: fallbackLanguage };
  }

  if (raw.includes("wikipedia.org")) return null;

  const title = raw.replace(/_/g, " ").trim();
  if (!title) return null;
  return { title, language: fallbackLanguage };
}

function titleToSlug(title: string): string {
  return title.trim().replace(/\s+/g, "_");
}

export default function WikiFromFilePage() {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lang] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIKI_LANGUAGE;
    return readPreferredWikiLanguage();
  });

  const inferredInput = useMemo(() => extractWikipediaInput(text, lang), [text, lang]);

  const handleOpenArticle = ({ title, language }: ParsedWikipediaInput) => {
    const slug = titleToSlug(title);
    router.push(`/wiki/${encodeURIComponent(slug)}?lang=${encodeURIComponent(language)}`);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);

    if (file.size > 1024 * 1024) {
      setError("Le fichier est trop volumineux (max 1 Mo).");
      return;
    }

    const content = await file.text();
    setText(content);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header initialLanguage={lang} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 max-w-[1000px]">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Ouvrir un article depuis un fichier
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400 max-w-[70ch]">
            Uploade un fichier texte contenant un titre Wikipédia, ou une URL
            d’article, puis ouvre la page correspondante.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/30 p-6 sm:p-8">
          <label className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300/70 dark:border-zinc-700/70 bg-white/70 dark:bg-zinc-950/40 px-6 py-10 text-center cursor-pointer transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
            <input
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/70 dark:border-zinc-800/70">
              <Upload className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                Choisir un fichier .txt
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Ex: “React (software)” ou “https://fr.wikipedia.org/wiki/React_(software)”
              </div>
            </div>
          </label>

          <div className="mt-6 grid grid-cols-1 gap-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <FileText className="w-4 h-4" />
              <span>{fileName ? fileName : "Aucun fichier sélectionné"}</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => {
                setError(null);
                setFileName(null);
                setText(e.target.value);
              }}
              placeholder="Colle ici un titre ou une URL Wikipédia…"
              className="w-full min-h-[160px] rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 transition"
            />

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!inferredInput}
              onClick={() => {
                if (!inferredInput) {
                  setError("Impossible d’extraire un titre Wikipédia depuis ce contenu.");
                  return;
                }
                handleOpenArticle(inferredInput);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Ouvrir l’article
              <ArrowRight className="w-4 h-4" />
            </button>

            {inferredInput && (
              <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                Titre détecté: {inferredInput.title} ({inferredInput.language})
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
