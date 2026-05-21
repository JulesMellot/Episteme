import { resolveUiLocale } from "@/lib/wiki-language";

export interface HeaderUiCopy {
  searchPlaceholder: string;
  lightMode: string;
  darkMode: string;
  sepiaMode: string;
  dimMode: string;
  displaySettings: string;
  close: string;
  themeSection: string;
  typographySection: string;
  typographyEditorial: string;
  typographyClassic: string;
  readingSection: string;
  textSize: string;
  readingWidth: string;
  lineHeight: string;
  density: string;
  modeCompact: string;
  modeComfort: string;
  modeWide: string;
  modeNormal: string;
  modeAiry: string;
  distractionFree: string;
  imageLayout: string;
  imageInline: string;
  imageFloatRight: string;
  quickFacts: string;
  backToContents: string;
  scrollTop: string;
  exitFocusMode: string;
}

export function getHeaderUiCopy(language: string): HeaderUiCopy {
  const uiLocale = resolveUiLocale(language);

  if (uiLocale === "fr") {
    return {
      searchPlaceholder: "Rechercher sur Wikipédia...",
      lightMode: "Mode clair",
      darkMode: "Mode sombre",
      sepiaMode: "Sépia (chaud)",
      dimMode: "Tamisé (froid)",
      displaySettings: "Réglages d'affichage",
      close: "Fermer",
      themeSection: "Thème",
      typographySection: "Typographie des titres",
      typographyEditorial: "Éditoriale (Playfair)",
      typographyClassic: "Classique (Sora)",
      readingSection: "Lecture",
      textSize: "Taille du texte",
      readingWidth: "Largeur de lecture",
      lineHeight: "Interligne",
      density: "Densité UI",
      modeCompact: "Compact",
      modeComfort: "Confort",
      modeWide: "Large",
      modeNormal: "Normal",
      modeAiry: "Aéré",
      distractionFree: "Mode sans distraction",
      imageLayout: "Mise en page des images",
      imageInline: "Inline",
      imageFloatRight: "Flottantes à droite",
      quickFacts: "Quick facts épinglées",
      backToContents: "Retour au sommaire",
      scrollTop: "Remonter",
      exitFocusMode: "Quitter le mode focus",
    };
  }

  return {
    searchPlaceholder: "Search Wikipedia...",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    sepiaMode: "Sepia (Warm)",
    dimMode: "Dim (Cool)",
    displaySettings: "Display settings",
    close: "Close",
    themeSection: "Theme",
    typographySection: "Heading typography",
    typographyEditorial: "Editorial (Playfair)",
    typographyClassic: "Classic (Sora)",
    readingSection: "Reading",
    textSize: "Text size",
    readingWidth: "Reading width",
    lineHeight: "Line height",
    density: "UI density",
    modeCompact: "Compact",
    modeComfort: "Comfort",
    modeWide: "Wide",
    modeNormal: "Normal",
    modeAiry: "Airy",
    distractionFree: "Distraction-free mode",
    imageLayout: "Image layout",
    imageInline: "Inline",
    imageFloatRight: "Float right",
    quickFacts: "Pin quick facts",
    backToContents: "Back to contents",
    scrollTop: "Scroll to top",
    exitFocusMode: "Exit focus mode",
  };
}
