import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { introDecideScript } from "@/components/intro/Intro";

export const metadata: Metadata = {
  metadataBase: new URL("https://madlads.com"),
  title: { default: "Mad Lads — Everyone’s mad here.", template: "%s — Mad Lads" },
  description: "10,000 Mad Lads on Solana. The collection by Backpack.",
  openGraph: {
    title: "Mad Lads",
    description: "10,000 Mad Lads on Solana. The collection by Backpack.",
    url: "https://madlads.com",
    siteName: "Mad Lads",
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", site: "@madladsnft" },
};

export const viewport: Viewport = { themeColor: "#1a0508" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        {/* Decides before the first paint whether the homepage intro plays (components/intro). */}
        <script dangerouslySetInnerHTML={{ __html: introDecideScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-white focus:p-3">
          Skip to content
        </a>
        <ScrollToTopOnNavigate />
        {children}
      </body>
    </html>
  );
}
