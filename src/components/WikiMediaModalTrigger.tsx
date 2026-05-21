"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { extractModalTargetFromHref, type WikiMediaModalRequest } from "@/lib/wiki-media-modal";

const WikiMediaModal = dynamic(() =>
  import("@/components/WikiMediaModal").then((mod) => mod.WikiMediaModal)
);

interface WikiMediaModalTriggerProps {
  language: string;
}

export function WikiMediaModalTrigger({ language }: WikiMediaModalTriggerProps) {
  const [initialRequest, setInitialRequest] = useState<WikiMediaModalRequest | null>(null);
  const [modalEnabled, setModalEnabled] = useState(false);

  useEffect(() => {
    if (modalEnabled) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (!anchor.closest(".wiki-content, .wiki-infobox")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const modalTarget = extractModalTargetFromHref(href, language, window.location.href);
      if (!modalTarget) return;

      event.preventDefault();
      event.stopPropagation();
      setInitialRequest(modalTarget);
      setModalEnabled(true);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [language, modalEnabled]);

  if (!modalEnabled) return null;

  return <WikiMediaModal language={language} initialRequest={initialRequest} />;
}
