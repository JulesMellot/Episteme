"use client";

import { cn } from "@/lib/utils";
import type { TocItem } from "@/lib/wikipedia";
import { useEffect, useState } from "react";
import { ListTree } from "lucide-react";

interface SidebarProps {
  toc: TocItem[];
}

export function Sidebar({ toc }: SidebarProps) {
  const [activeId, setActiveId] = useState<string>("");

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
    <aside className="w-72 flex-shrink-0 hidden xl:block pr-10">
      <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
        <div className="flex items-center gap-2 mb-6">
          <ListTree className="w-4 h-4 text-zinc-400" />
          <h4 className="font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Contents
          </h4>
        </div>
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
      </div>
    </aside>
  );
}
