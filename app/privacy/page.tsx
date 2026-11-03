import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { links } from "@/data/site";

// TODO: legal review before launch (Backpack legal). Update the "Holder area" section before Matrica login goes live.
// Keep this page true to the code: if analytics, cookies or a login are added, this page must change too.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data madlads.com collects (very little) and how it is used.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "November 3, 2026";

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <>
        <p>
          This policy explains what happens to your data when you visit madlads.com, the website of Mad Lads, the NFT collection by Backpack. “We” means the
          Mad Lads team at Backpack.
        </p>
        <ul>
          <li>You don’t need an account or a wallet to browse the site.</li>
          <li>We don’t use advertising, tracking cookies or analytics tools.</li>
          <li>We don’t sell your data.</li>
        </ul>
      </>
    ),
  },
  {
    id: "hosting",
    title: "Data from your visit",
    body: (
      <>
        <p>
          Like any website, the site receives some technical data when your browser loads a page: your IP address, browser and device type, the page you asked
          for and the time of the request.
        </p>
        <p>
          The site is hosted by {ext("https://vercel.com", "Vercel")}. Vercel processes this data to deliver the pages, keep the site secure and stop abuse, and
          keeps it in short-lived server logs. We don’t use it to identify you or build a profile.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        The site sets no cookies and stores nothing in your browser. That’s why there is no cookie banner.
      </p>
    ),
  },
  {
    id: "embeds",
    title: "Videos and outside content",
    body: (
      <>
        <p>
          Meetup videos are played with YouTube’s privacy-enhanced mode. Nothing loads from YouTube until you press play. Once you do, Google’s{" "}
          {ext("https://policies.google.com/privacy", "privacy policy")} applies to that video.
        </p>
        <p>
          Thumbnails of the art and the news covers are fetched by our server, so your browser doesn’t contact those sources. When you open a Mad Lad at full
          size, the original image loads directly from the collection’s public storage on Amazon Web Services.
        </p>
      </>
    ),
  },
  {
    id: "links",
    title: "Other sites",
    body: (
      <p>
        When you follow a link to another service, like Mad News on Substack, Magic Eden, Tensor, FoxySwap, Backpack, X or Discord, that service’s own privacy
        policy applies. Subscribing to {ext(links.newsletter, "Mad News")} happens on Substack, not on this site.
      </p>
    ),
  },
  {
    id: "holders",
    title: "Holder area",
    body: (
      <p>
        A holder-only area with Matrica login is coming. Signing in will mean sharing your public wallet address so we can check which Mad Lads you hold. We
        will update this policy, with exactly what is collected and why, before the login goes live.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <p>
        Depending on where you live, you may have the right to ask what data we hold about you, to correct it or to delete it. Since the site collects almost
        nothing, there is usually nothing to hand over. If you have a request, contact us and we’ll help.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <>
        <p>We may update this policy, for example when new features arrive. The date at the top of the page shows the latest version.</p>
        <p>
          Questions? Write to <a href={links.legalEmail}>{links.legalEmail.replace("mailto:", "")}</a>. See also our{" "}
          <Link href="/terms">Terms of Use</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      summary={<p>The short version: no account, no tracking cookies, no analytics, no selling data. Just a website about Mad Lads.</p>}
      sections={sections}
    />
  );
}
