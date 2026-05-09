import type { Metadata } from "next";
import { Sora, JetBrains_Mono, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { absoluteUrl, DEFAULT_SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Episteme",
  description: DEFAULT_SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Episteme",
    description: DEFAULT_SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Episteme",
    description: DEFAULT_SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is CRITICAL here for next-themes to work properly in React 19
    <html
      lang="en"
      className={`${sora.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable} antialiased`}
      data-typography="editorial"
      suppressHydrationWarning
    >
      <body
        className="font-sans"
        suppressHydrationWarning
      >
        <Script
          defer
          src="https://analytics.tllm.fr/script.js"
          data-website-id="689935b1-94de-4ed8-9a85-cb7244507d0c"
        />
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          themes={['light', 'dark', 'sepia', 'dim']}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
