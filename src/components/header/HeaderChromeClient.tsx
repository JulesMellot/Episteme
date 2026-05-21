"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface HeaderChromeClientProps {
  children: React.ReactNode;
  isHome?: boolean;
  showReadingProgress?: boolean;
}

export function HeaderChromeClient({
  children,
  isHome = false,
  showReadingProgress = false,
}: HeaderChromeClientProps) {
  const [scrolled, setScrolled] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const canUseDom = typeof document !== "undefined";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      if (!showReadingProgress) return;

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(100, (window.scrollY / maxScroll) * 100) : 0;
      setReadingProgress(progress);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [showReadingProgress]);

  return (
    <>
      <header
        className={cn(
          "app-header sticky top-0 z-50 w-full transition-all duration-300",
          scrolled || !isHome
            ? "bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            : "bg-transparent border-transparent"
        )}
      >
        {children}
      </header>

      {canUseDom &&
        showReadingProgress &&
        createPortal(
          <div className="fixed top-0 left-0 right-0 z-[115] h-[2px] bg-transparent pointer-events-none">
            <div
              className="h-full bg-zinc-900 dark:bg-zinc-100 transition-[width] duration-150"
              style={{ width: `${readingProgress}%` }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
