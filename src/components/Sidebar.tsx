"use client";

import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/wikipedia";
import { useEffect, useState } from "react";
import { ChevronDown, ListTree } from "lucide-react";
import { resolveUiLocale } from "@/lib/wiki-language";

interface SidebarProps {
  toc: TocItem[];
  language?: string;
}

export function Sidebar({ toc, language = "en" }: SidebarProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const uiLocale = resolveUiLocale(language);
  const tocLabel = uiLocale === "fr" ? "Sommaire" : "Contents";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    toc.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [toc]);

  if (!toc || toc.length === 0) return null;

  return (
    <>
      <div className="wiki-toc-mobile w-full lg:hidden mb-6 rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-900/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-expanded={isMobileOpen}
          className="w-full cursor-pointer px-4 py-3 flex items-center justify-between text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-100"
        >
          <span className="inline-flex items-center gap-2">
            <ListTree className="w-4 h-4 text-zinc-400" />
            {tocLabel}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200",
              isMobileOpen && "rotate-180"
            )}
          />
        </button>
        {isMobileOpen && (
          <nav className="max-h-[50vh] overflow-y-auto px-4 pb-4 pt-1 flex flex-col space-y-2 relative">
            <div className="absolute left-4 top-1 bottom-4 w-[1px] bg-zinc-100 dark:bg-zinc-800/50" />
            {toc.map((item, index) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={`${item.id}-${index}-mobile`}
                  href={`#${item.id}`}
                  className={cn(
                    "relative block text-sm leading-5 break-words transition-colors duration-200 py-1",
                    item.level === 2
                      ? "pl-4 font-medium"
                      : "pl-7 text-[13px]",
                    isActive
                      ? "text-zinc-950 dark:text-zinc-50 font-semibold"
                      : "text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-zinc-50"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-[-0.5px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                  )}
                  {item.text}
                </a>
              );
            })}
          </nav>
        )}
      </div>

      <aside className="wiki-toc-desktop hidden w-72 flex-shrink-0 self-start pr-10 xl:sticky xl:top-28 xl:block">
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setIsDesktopOpen((open) => !open)}
            aria-expanded={isDesktopOpen}
            className="w-full cursor-pointer mb-6 flex items-center justify-between"
          >
            <span className="inline-flex items-center gap-2">
              <ListTree className="w-4 h-4 text-zinc-400" />
              <h4 className="font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                {tocLabel}
              </h4>
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200",
                isDesktopOpen && "rotate-180"
              )}
            />
          </button>
          {isDesktopOpen && (
            <nav className="flex flex-col space-y-2 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-zinc-100 dark:bg-zinc-800/50" />
              {toc.map((item, index) => {
                const isActive = activeId === item.id;
                return (
                  <a
                    key={`${item.id}-${index}`}
                    href={`#${item.id}`}
                    className={cn(
                      "relative text-[13px] transition-all duration-200 line-clamp-2 py-1 tracking-tight",
                      item.level === 2
                        ? "pl-4 font-medium"
                        : "pl-7 text-[12px]",
                      isActive
                        ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                        : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-[-0.5px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                    )}
                    {item.text}
                  </a>
                );
              })}
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
