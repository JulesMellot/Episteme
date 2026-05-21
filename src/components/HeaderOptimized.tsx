import Link from "next/link";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HeaderChromeClient } from "@/components/header/HeaderChromeClient";
import { HeaderPreferencesClient } from "@/components/header/HeaderPreferencesClient";
import { getHeaderUiCopy } from "@/lib/header-ui";
import { DEFAULT_WIKI_LANGUAGE, normalizeWikiLanguage } from "@/lib/wiki-language";

interface HeaderOptimizedProps {
  isHome?: boolean;
  hideSearch?: boolean;
  initialLanguage?: string;
}

export function HeaderOptimized({
  isHome = false,
  hideSearch = false,
  initialLanguage,
}: HeaderOptimizedProps) {
  const language = normalizeWikiLanguage(initialLanguage ?? DEFAULT_WIKI_LANGUAGE);
  const uiCopy = getHeaderUiCopy(language);
  const showReadingControls = !isHome && !hideSearch;

  return (
    <HeaderChromeClient isHome={isHome} showReadingProgress={showReadingControls}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-[1400px]">
        <div className="flex items-center space-x-3">
          <Link href={`/?lang=${encodeURIComponent(language)}`} className="flex items-center gap-2 group">
            <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50">
              Episteme
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 flex-1 justify-end">
          {!isHome && !hideSearch && (
            <SearchAutocomplete
              language={language}
              placeholder={uiCopy.searchPlaceholder}
              variant="header"
              showShortcut
            />
          )}

          <LanguageSwitcher initialLanguage={language} />
          <HeaderPreferencesClient
            language={language}
            showFloatingControls={showReadingControls}
          />
        </div>
      </div>
    </HeaderChromeClient>
  );
}
