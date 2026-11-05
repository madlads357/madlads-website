import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { links } from "@/data/site";

// TODO: legal review before launch (Backpack legal).
// Keep this page true to the code: if analytics, cookies, stored data or outside services change, this page must too.
// What the code does today: lib/auth (login, cookies), lib/helius.ts, lib/db.ts + db/schema.sql, lib/passport-share.ts.
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data madlads.com collects (very little) and how it is used.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "November 5, 2026";

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
          This policy explains what happens to your data when you visit madlads.com, the website of MAD LADS, the NFT collection by Backpack. “We” means the
          MAD LADS team at Backpack.
        </p>
        <ul>
          <li>You don’t need an account or a wallet to browse the site.</li>
          <li>Holders can log in with Matrica to reach the holder area. That is the only time we receive data about you.</li>
          <li>We don’t use advertising, tracking cookies or analytics tools, and we don’t sell your data.</li>
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
      <>
        <p>Browsing the site sets no cookies. Cookies only appear when you log in to the holder area, and they are all needed for the login to work:</p>
        <ul>
          <li>
            <strong>ml_login</strong>: keeps a one-time code while you log in on Matrica. Deleted as soon as you come back, or after 10 minutes.
          </li>
          <li>
            <strong>ml_session</strong>: keeps you logged in (encrypted, unreadable by the page). Deleted when you log out, or after 8 hours.
          </li>
          <li>
            <strong>ml_user</strong>: your name and the number of your passport LAD, so the menu bar can show them. Same lifetime as ml_session.
          </li>
        </ul>
        <p>
          The site also remembers your chosen passport photo in your browser’s storage, as a fallback. None of this is used for tracking, which is why there is
          no cookie banner.
        </p>
      </>
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
          In the holder area, the playlist plays through Spotify’s player. It loads from Spotify only when you open the playlist, and Spotify’s{" "}
          {ext("https://www.spotify.com/legal/privacy-policy/", "privacy policy")} and cookies then apply to it.
        </p>
        <p>
          Thumbnails of the art and the news covers are fetched by our server, so your browser doesn’t contact those sources. When you open a MAD LADS at full
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
        When you follow a link to another service, like MAD News on Substack, Magic Eden, Tensor, FoxySwap, Backpack, X or Discord, that service’s own privacy
        policy applies. Subscribing to {ext(links.newsletter, "MAD News")} happens on Substack, not on this site.
      </p>
    ),
  },
  {
    id: "holders",
    title: "Holder area",
    body: (
      <>
        <p>
          You log in with {ext("https://matrica.io", "Matrica")}, which already knows your wallets and linked accounts. You choose on Matrica what to share. We ask
          for:
        </p>
        <ul>
          <li>your Matrica user ID and name;</li>
          <li>the MAD LADS held in the wallets you linked to Matrica, and the addresses of those wallets;</li>
          <li>your X handle, shown on your passport;</li>
          <li>your roles on the MAD LADS Discord server, shown as stamps on your passport.</li>
        </ul>
        <p>
          To work out since when you hold a MAD LADS (“MAD since”), your wallet addresses are sent to {ext("https://www.helius.dev", "Helius")}, a Solana data
          service, which reads the public blockchain. This happens at login, at most once a week. We don’t store your wallet addresses, and we never ask you to
          sign anything or connect a wallet.
        </p>
      </>
    ),
  },
  {
    id: "stored",
    title: "What we keep",
    body: (
      <>
        <p>
          For holders who log in, our database keeps your Matrica user ID, the LAD you chose as passport photo and your “MAD since” date, so they follow you on
          every device. The database is hosted by {ext("https://neon.com", "Neon")} in the European Union (Frankfurt).
        </p>
        <p>
          The passport video and image are made in your browser. They are not uploaded to us, unless you share them yourself on another service.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Sharing your passport",
    body: (
      <>
        <p>
          When you open your passport, the site prepares a public link to it (madlads.com/p/…). Anyone with that link can see your passport: your name, X handle,
          passport LAD, number of LADS, “MAD since” and stamps. Nothing else, and never your wallet addresses.
        </p>
        <p>
          We store that passport with the link and count how many times it was opened. You can stop sharing at any time from your passport (Copy, then “Stop
          sharing my link”): the link stops working at once. Otherwise it expires after a year.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <p>
        Depending on where you live, you may have the right to ask what data we hold about you, to correct it or to delete it. If you never logged in, we hold
        nothing about you. If you did, write to us and we’ll send or delete what is listed above. You can also stop sharing your passport yourself at any time.
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
      summary={
        <p>
          The short version: browsing needs no account and sets no cookies. If you log in as a holder, we keep the little your passport needs, and you decide
          what you share. No tracking, no analytics, no selling data.
        </p>
      }
      sections={sections}
    />
  );
}
