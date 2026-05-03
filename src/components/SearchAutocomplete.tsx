"use client";

import { cn } from "@/lib/utils";
import { resolveUiLocale } from "@/lib/wiki-language";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FocusEvent, FormEvent, KeyboardEvent } from "react";

interface SearchAutocompleteProps {
  language: string;
  placeholder: string;
  defaultValue?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  variant?: "home" | "page" | "header";
  showShortcut?: boolean;
}

interface SearchSuggestion {
  title: string;
  snippet: string;
  pageid: number;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 220;

function toSlug(title: string) {
  return encodeURIComponent(title.replace(/\s+/g, "_"));
}

export function SearchAutocomplete({
  language,
  placeholder,
  defaultValue = "",
  autoFocus = false,
  submitLabel,
  variant = "page",
  showShortcut = false,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const uiLocale = resolveUiLocale(language);
  const uiCopy = useMemo(
    () =>
      uiLocale === "fr"
        ? {
            loading: "Recherche en cours...",
            noResults: "Aucun resultat pour cette recherche.",
            seeAll: "Voir tous les resultats pour",
            openArticle: "Ouvrir l’article",
          }
        : {
            loading: "Searching...",
            noResults: "No results for this query.",
            seeAll: "See all results for",
            openArticle: "Open article",
          },
    [uiLocale]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
        setIsFocused(false);
      }
    }

    function handleGlobalKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (!isFocused || trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);
      setHasFetched(false);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          lang: language,
          limit: "6",
        });
        const response = await fetch(`/api/wiki/search?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Search autocomplete request failed.");
        }

        const data = (await response.json()) as {
          results?: SearchSuggestion[];
        };

        if (controller.signal.aborted) return;

        setSuggestions(Array.isArray(data.results) ? data.results : []);
        setHasFetched(true);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(error);
        setSuggestions([]);
        setHasFetched(true);
        setIsOpen(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isFocused, language, query]);

  const trimmedQuery = query.trim();
  const showDropdown =
    isOpen &&
    trimmedQuery.length >= MIN_QUERY_LENGTH &&
    (isLoading || suggestions.length > 0 || hasFetched);
  const activeSuggestion =
    activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : null;
  const showSubmitButton = Boolean(submitLabel);

  function closeDropdown() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function navigateToSuggestion(title: string) {
    closeDropdown();
    router.push(`/wiki/${toSlug(title)}?lang=${encodeURIComponent(language)}`);
  }

  function handleInputFocus() {
    setIsFocused(true);
    if (query.trim().length >= MIN_QUERY_LENGTH) {
      setIsOpen(true);
    }
  }

  function handleInputChange(nextValue: string) {
    const trimmed = nextValue.trim();
    setQuery(nextValue);
    setActiveIndex(-1);
    if (trimmed.length >= MIN_QUERY_LENGTH) {
      setIsOpen(true);
      return;
    }

    setSuggestions([]);
    setHasFetched(false);
    setIsLoading(false);
    closeDropdown();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeDropdown();
      return;
    }

    if (!showDropdown || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === "Enter" && activeSuggestion) {
      event.preventDefault();
      navigateToSuggestion(activeSuggestion.title);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!trimmedQuery) {
      event.preventDefault();
      return;
    }

    if (activeSuggestion) {
      event.preventDefault();
      navigateToSuggestion(activeSuggestion.title);
      return;
    }

    closeDropdown();
  }

  function handleWrapperBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && wrapperRef.current?.contains(nextTarget)) {
      return;
    }

    setIsFocused(false);
    closeDropdown();
  }

  const styles = {
    home: {
      form: "relative max-w-2xl mx-auto w-full group",
      control: "relative flex items-center transition-transform duration-300 group-focus-within:-translate-y-1",
      glow:
        "absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500",
      shell:
        "relative flex items-center w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm ring-1 ring-zinc-200/50 dark:ring-zinc-800/50 overflow-hidden",
      icon: "absolute left-5 w-6 h-6 text-zinc-400",
      input:
        "w-full pl-14 pr-24 py-5 bg-transparent outline-none text-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400",
      accessory: "absolute right-3 hidden sm:flex items-center gap-1",
      submit: "",
      dropdown:
        "mt-3 rounded-2xl border border-zinc-200/70 bg-white/95 p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/95",
      footer:
        "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white",
    },
    page: {
      form: "relative w-full group",
      control: "relative flex items-center",
      glow: "",
      shell:
        "relative flex items-center w-full rounded-[2rem] bg-white dark:bg-[#111111] border border-zinc-200/80 dark:border-zinc-800/80 focus-within:border-zinc-300 dark:focus-within:border-zinc-700 focus-within:ring-4 focus-within:ring-zinc-100 dark:focus-within:ring-zinc-900/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300",
      icon:
        "absolute left-6 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors duration-300",
      input:
        "w-full pl-16 pr-32 py-5 sm:py-6 rounded-[2rem] bg-transparent outline-none text-lg sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
      accessory: "",
      submit:
        "absolute right-3 sm:right-4 px-6 py-3 sm:py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-[1.5rem] text-sm sm:text-base font-semibold hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-200 shadow-sm",
      dropdown:
        "mt-3 rounded-[1.75rem] border border-zinc-200/80 bg-white/95 p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-[#111111]/95",
      footer:
        "flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white",
    },
    header: {
      form: "relative w-full max-w-md hidden sm:block group",
      control: "relative flex items-center",
      glow: "",
      shell: "relative flex items-center w-full",
      icon: "absolute left-3 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors",
      input:
        "w-full pl-9 pr-16 py-2 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-800/50 focus:border-blue-500/50 focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500",
      accessory: "absolute right-3 hidden sm:flex items-center gap-0.5 pointer-events-none",
      submit: "",
      dropdown:
        "mt-2 rounded-2xl border border-zinc-200/70 bg-white/95 p-2 shadow-xl shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-900/95",
      footer:
        "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white",
    },
  }[variant];

  return (
    <div ref={wrapperRef} className="relative" onBlur={handleWrapperBlur}>
      <form action="/wiki/search" method="GET" className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.control}>
          {styles.glow ? <div className={styles.glow} /> : null}
          <div className={styles.shell}>
            <Search className={styles.icon} />
            <input type="hidden" name="lang" value={language} />
            <input
              ref={inputRef}
              type="text"
              name="q"
              required
              value={query}
              autoFocus={autoFocus}
              autoComplete="off"
              placeholder={placeholder}
              className={styles.input}
              role="combobox"
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-expanded={showDropdown}
              aria-controls={showDropdown ? listboxId : undefined}
              aria-activedescendant={
                activeSuggestion ? `${listboxId}-option-${activeSuggestion.pageid}` : undefined
              }
              onFocus={handleInputFocus}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
            />

            {showSubmitButton ? (
              <button type="submit" className={styles.submit}>
                {submitLabel}
              </button>
            ) : null}

            {!showSubmitButton && showShortcut && variant === "header" ? (
              <div className={styles.accessory}>
                <kbd className="px-1.5 py-0.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded font-mono text-[10px] text-zinc-500">
                  ⌘
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded font-mono text-[10px] text-zinc-500">
                  K
                </kbd>
              </div>
            ) : null}

            {!showSubmitButton && showShortcut && variant !== "header" ? (
              <div className={styles.accessory}>
                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                  ⌘
                </kbd>
                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                  K
                </kbd>
              </div>
            ) : null}
          </div>
        </div>
      </form>

      {showDropdown ? (
        <div className={cn("absolute left-0 right-0 z-50", styles.dropdown)}>
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-xl px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>{uiCopy.loading}</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul id={listboxId} role="listbox" className="space-y-1">
              {suggestions.map((suggestion, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={suggestion.pageid} role="presentation">
                    <button
                      id={`${listboxId}-option-${suggestion.pageid}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={cn(
                        "flex w-full items-start justify-between gap-4 rounded-xl px-4 py-3 text-left transition",
                        isActive
                          ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/70 dark:hover:text-white"
                      )}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => navigateToSuggestion(suggestion.title)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{suggestion.title}</div>
                        {suggestion.snippet ? (
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {suggestion.snippet}
                          </div>
                        ) : null}
                      </div>
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                      <span className="sr-only">
                        {uiCopy.openArticle} {suggestion.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl px-4 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              {uiCopy.noResults}
            </div>
          )}

          {!isLoading && trimmedQuery ? (
            <button
              type="button"
              className={cn("mt-2 border-t border-zinc-200/70 pt-2 dark:border-zinc-800/70", styles.footer)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                closeDropdown();
                router.push(
                  `/wiki/search?q=${encodeURIComponent(trimmedQuery)}&lang=${encodeURIComponent(language)}`
                );
              }}
            >
              <span className="truncate">
                {uiCopy.seeAll} <strong>&ldquo;{trimmedQuery}&rdquo;</strong>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
