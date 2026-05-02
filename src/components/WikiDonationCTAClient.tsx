"use client";

import { WikiDonationCTA } from "@/components/WikiDonationCTA";

function getBrowserLanguageTag(): string {
  if (typeof navigator === "undefined") return "en";
  return navigator.languages?.[0] ?? navigator.language ?? "en";
}

export function WikiDonationCTAClient() {
  return <WikiDonationCTA browserLanguage={getBrowserLanguageTag()} />;
}
