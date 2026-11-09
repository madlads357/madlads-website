import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { links } from "@/data/site";

// TODO: legal review before launch (Backpack legal).
// Keep this page true to the code: if analytics, cookies, stored data or outside services change, this page must too.
// What the code does today: lib/auth (login, cookies), lib/wallet/backpack.ts, lib/accounts (Discord, X), lib/helius.ts, lib/db.ts + db/schema.sql,
// lib/passport-share.ts.
// Written for Login with Backpack. If Matrica comes back (AUTH_PROVIDER=matrica), the Matrica wording is in git history (before Nov 9, 2026).
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What data madlads.com collects (very little) and how it is used.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "November 9, 2026";

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
          <li>Holders can log in with their Backpack wallet to reach the holder area. That is the only time we receive data about you.</li>
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
            <strong>ml_wallet</strong>: keeps the one-time message your wallet signs while you log in. Deleted as soon as you have signed, or after 5 minutes.
          </li>
          <li>
            <strong>ml_link</strong>: keeps a one-time code while you link your Discord or X account. Deleted as soon as you come back, or after 10 minutes.
          </li>
          <li>
            <strong>ml_session</strong>: keeps you logged in (encrypted, unreadable by the page). Deleted when you log out, or after 8 hours.
          </li>
          <li>
            <strong>ml_user</strong>: your shortened wallet address and the number of your passport LAD, so the menu bar can show them. Same lifetime as
            ml_session.
          </li>
        </ul>
        <p>
          The site also uses your browser’s storage to remember your chosen passport photo (as a fallback) and whether you ticked “I use a Ledger”. None of
          this is used for tracking, which is why there is
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
          You log in with your {ext("https://backpack.app", "Backpack")} wallet: you sign a “Sign In With Solana” message to prove the wallet is yours (with a
          Ledger, a transaction that our server checks and never sends). Signing is free. It gives us no
          access to your wallet or your funds, and the site disconnects from your wallet as soon as you are logged in. We never ask you to send, approve or
          pay anything.
        </p>
        <p>We receive:</p>
        <ul>
          <li>your wallet’s public address;</li>
          <li>the addresses of the wallets you link to it (“vaults”), which you confirm by signing with each of them;</li>
          <li>what your wallet signed, which we check and then discard.</li>
        </ul>
        <p>
          To see which MAD LADS you hold, and since when (“MAD since”), these addresses are sent to {ext("https://www.helius.dev", "Helius")}, a Solana data
          service, which reads the public blockchain. This happens when you log in, and “MAD since” at most once a week. Wallet addresses and holdings are
          public on the blockchain; what the site adds is the link between the wallets you chose to connect.
        </p>
        <p>Backpack is a separate service: its own {ext("https://backpack.app/privacy", "privacy policy")} applies to the wallet app itself.</p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Linked accounts",
    body: (
      <>
        <p>
          In the holder area you can choose to link your Discord account, to show your name and your roles on the MAD LADS Discord server as stamps on your
          passport. Discord asks for your permission first. We then receive your Discord user ID, your Discord name and the list of your roles on the MAD LADS
          server, and nothing else: not your email, your messages or your other servers.
        </p>
        <p>
          Discord gives us a key to read this once. We use it right away and then cancel it, so we keep no access to your Discord account. “Refresh roles”
          asks Discord again. Unlink Discord in the holder area and what we stored about it is deleted at once.
        </p>
        <p>
          You can also link your X account, to show your handle on your passport. X asks for your permission first. We receive your X user ID and handle,
          and nothing else: we can’t post, read your messages or see who you follow. We don’t keep the key X gives us, and ask X to cancel it right away.
          You can also remove the site from your X settings (Security and account access → Apps and sessions).
        </p>
        <p>
          Once linked, your X handle (or, without X, your Discord name) replaces your shortened wallet address as your name in the holder area and on your
          passport. Unlink an account in the holder area and what we stored about it is deleted at once. The{" "}
          {ext("https://discord.com/privacy", "Discord")} and {ext("https://x.com/en/privacy", "X")} privacy policies apply to those accounts.
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
          For holders who log in, our database keeps your wallet address, the wallets you linked to it, the LAD you chose as passport photo and your “MAD since”
          date, so they follow you on every device. If you link Discord, it also keeps your Discord user ID, name and stamp roles; if you link X, your X user ID and handle. A short-lived one-time code for each login is kept for a few minutes so a signed login can’t be used twice, then deleted. Linked wallets and accounts
          stay linked until you remove them in the holder area, which deletes them at once. The database is hosted by {ext("https://neon.com", "Neon")} in the European Union (Frankfurt).
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
          When you open your passport, the site prepares a public link to it (madlads.com/p/…). Anyone with that link can see your passport: your name (your
          X handle or Discord name if you linked one, otherwise your shortened wallet address, like 7xKX…9fQ2), passport LAD, number of LADS, “MAD since” and stamps. Never your full wallet address or your linked
          wallets.
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
        nothing about you. If you did, write to us with your wallet address and we’ll send or delete what is listed above. You can also stop sharing your passport yourself at any time.
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
