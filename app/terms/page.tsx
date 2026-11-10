import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { links } from "@/data/site";

// TODO: legal review before launch (Backpack legal). Confirm the entity, the governing law and the art license.
// Written for Login with Backpack (lib/auth/wallet.ts). If Matrica comes back (AUTH_PROVIDER=matrica), adapt the holder section.
export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using madlads.com.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "November 9, 2026";

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
  </a>
);

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          madlads.com is the official website of MAD LADS, the NFT collection by Backpack. These terms apply when you visit or use it. By using the site, you
          agree to them. If you don’t, please don’t use the site.
        </p>
        <p>
          “We” and “us” mean the MAD LADS team at Backpack. “You” means anyone using the site.
        </p>
      </>
    ),
  },
  {
    id: "the-site",
    title: "What the site is",
    body: (
      <>
        <p>
          The site tells the story of MAD LADS and lets you browse the collection. It is for information only. You can’t buy, sell, mint or store NFTs or
          tokens here, and we never ask you to connect a wallet to browse it.
        </p>
        <p>We may change, pause or remove any part of the site at any time.</p>
      </>
    ),
  },
  {
    id: "nfts",
    title: "Owning a MAD LADS",
    body: (
      <>
        <p>
          MAD LADS live on the Solana blockchain. Owning one means holding the token in your own wallet. Buying, selling and transferring happen on
          marketplaces and wallets that we don’t run, under their own terms.
        </p>
        <p>
          Any rights to use the art of the MAD LADS you own come from the MAD LADS license, not from these terms.
        </p>
      </>
    ),
  },
  {
    id: "no-advice",
    title: "No financial advice",
    body: (
      <p>
        Nothing on the site is financial, investment, legal or tax advice. Prices of NFTs and tokens can go up or down sharply, and you can lose money. Mentions
        of Backpack products, tokens or partners are information, not a recommendation to buy anything.
      </p>
    ),
  },
  {
    id: "safety",
    title: "Staying safe",
    body: (
      <>
        <p>Scammers often pretend to be us. Keep these in mind:</p>
        <ul>
          <li>We will never message you first to offer a mint, an airdrop or support.</li>
          <li>We will never ask for your seed phrase or private key. Nobody legitimate will.</li>
          <li>
            Logging in to the holder area only asks your wallet to sign a free sign-in for madlads.com. It never asks you to send, approve or pay anything. If a
            “MAD LADS login” does, it isn’t us. (With a Ledger, the transaction you approve only contains a short note naming this site and is never sent.)
          </li>
          <li>
            For peer-to-peer trades, only use {ext(links.foxySwap, "FoxySwap")}. Use the official links on this site for everything else.
          </li>
        </ul>
        <p>You are responsible for your wallet, your keys and the transactions you sign.</p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Other sites and services",
    body: (
      <p>
        The site links to services we don’t control, like {ext(links.magicEden, "Magic Eden")}, {ext(links.tensor, "Tensor")}, FoxySwap,{" "}
        {ext(links.backpack, "Backpack")}, X, Discord, YouTube and MAD News on Substack. Their own terms and privacy policies apply when you use them, and we
        aren’t responsible for their content or for what happens there.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Brand and content",
    body: (
      <>
        <p>
          The MAD LADS name, logos, art, photos, videos and the design of this site belong to Backpack or to the people who made them. You’re welcome to share
          links and screenshots. Please don’t use our brand in a way that suggests we made, approve or sponsor something when we didn’t.
        </p>
        <p>Photos and posts from the community stay the property of their authors. If you’d like one removed, contact us.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "Using the site fairly",
    body: (
      <>
        <p>When you use the site, please don’t:</p>
        <ul>
          <li>try to break, overload or get unauthorized access to it;</li>
          <li>scrape it in a way that slows it down for others;</li>
          <li>pretend to be MAD LADS, Backpack or anyone on the team.</li>
        </ul>
      </>
    ),
  },
  {
    id: "holders",
    title: "Holder area",
    body: (
      <>
        <p>
          Holders can log in with their Backpack wallet to reach the holder area. Access depends on holding at least one MAD LADS in that wallet or in a wallet
          you linked to it, and may change as your holdings do. We read holdings from the public blockchain through a data provider; if that is wrong or
          unavailable, access may be too. Features in the holder area can change or end at any time.
        </p>
        <p>
          You can link other wallets you own (“vaults”, for example a Ledger) to the wallet you log in with, by signing once with each of them. Only link
          wallets you control. A link lets anyone who can log in with your everyday wallet see the vault’s MAD LADS in the holder area, and nothing more: it
          gives no access to the vault’s funds or NFTs. You can remove a link at any time, from either wallet: log in with the vault wallet to see which wallets can log in for it.
        </p>
        <p>
          You can also link your Discord account, to show your MAD LADS server roles as stamps on your passport, and your X account, to show your handle.
          Only link your own accounts. Stamps reflect your
          roles when you linked or last refreshed, and can be removed if they no longer match.
        </p>
        <p>
          The holder map is optional. Your pin is an anonymous dot unless you choose to show your name and LAD. Only pin a city you really live in or are near, and remember that other
          holders can see your pin, and your name and LAD if you choose to show them. Don’t use the map to track down, contact or harass other holders, and don’t copy or scrape it. You
          can move or remove your pin, or switch your name and LAD on or off, at any time.
        </p>
        <p>
          Your MAD LADS Passport can be shared through a public link. You decide whether to share it, and you can stop sharing at any time. Please don’t share links
          in a way that suggests a passport is someone else’s. How we handle your data is in our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        The site is provided “as is”. We do our best to keep it accurate and online, but we can’t promise it will always be complete, up to date or available.
        To the extent the law allows, we aren’t liable for losses that come from using the site or the services it links to.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <>
        <p>
          We may update these terms. The date at the top of the page shows the latest version. Continuing to use the site after a change means you accept the
          new terms.
        </p>
        <p>
          Questions? Write to <a href={links.legalEmail}>{links.legalEmail.replace("mailto:", "")}</a>. See also our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated={UPDATED}
      summary={<p>The short version: enjoy the site, it’s for information only, nothing here is financial advice, and never share your seed phrase.</p>}
      sections={sections}
    />
  );
}
