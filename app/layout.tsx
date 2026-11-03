import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { introDecideScript } from "@/components/intro/Intro";
import { siteUrl } from "@/lib/site-url";
import { links } from "@/data/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Mad Lads | Everyone’s mad here.", template: "%s | Mad Lads" },
  description: "10,000 Mad Lads on Solana. The collection by Backpack.",
  openGraph: {
    title: "Mad Lads",
    description: "10,000 Mad Lads on Solana. The collection by Backpack.",
    url: siteUrl,
    siteName: "Mad Lads",
  },
  twitter: { card: "summary_large_image", site: "@MadLads" },
};

// Structured data: tells search engines (and AI) who the site belongs to and where its official accounts are.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Mad Lads",
      url: siteUrl,
      logo: `${siteUrl}/icon.png`,
      description: "10,000 Mad Lads on Solana. The collection by Backpack.",
      sameAs: [links.x, links.discord, links.newsletter, links.magicEden, links.tensor],
      parentOrganization: { "@type": "Organization", name: "Backpack", url: links.backpack },
    },
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Mad Lads", url: siteUrl, publisher: { "@id": `${siteUrl}/#organization` } },
  ],
};

export const viewport: Viewport = { themeColor: "#1a0508" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        {/* Decides before the first paint whether the homepage intro plays (components/intro). */}
        <script dangerouslySetInnerHTML={{ __html: introDecideScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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
