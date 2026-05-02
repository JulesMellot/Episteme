import type { Metadata } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Episteme - Modern Wikipedia Reader",
  description: "A typography-focused, lightweight Wikipedia reader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning is CRITICAL here for next-themes to work properly in React 19
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${jetbrainsMono.variable} font-sans`}
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
