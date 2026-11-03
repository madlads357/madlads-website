import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { links } from "@/data/site";

// TODO: legal review before launch (Backpack legal). Confirm the entity, the governing law and the art license.
export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using madlads.com.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "November 3, 2026";

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
          madlads.com is the official website of Mad Lads, the NFT collection by Backpack. These terms apply when you visit or use it. By using the site, you
          agree to them. If you don’t, please don’t use the site.
        </p>
        <p>
          “We” and “us” mean the Mad Lads team at Backpack. “You” means anyone using the site.
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
          The site tells the story of Mad Lads and lets you browse the collection. It is for information only. You can’t buy, sell, mint or store NFTs or
          tokens here, and we never ask you to connect a wallet to browse it.
        </p>
        <p>We may change, pause or remove any part of the site at any time.</p>
      </>
    ),
  },
  {
    id: "nfts",
    title: "Owning a Mad Lad",
    body: (
      <>
        <p>
          Mad Lads live on the Solana blockchain. Owning one means holding the token in your own wallet. Buying, selling and transferring happen on
          marketplaces and wallets that we don’t run, under their own terms.
        </p>
        <p>
          Any rights to use the art of the Mad Lad you own come from the Mad Lads license, not from these terms.
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
        {ext(links.backpack, "Backpack")}, X, Discord, YouTube and Mad News on Substack. Their own terms and privacy policies apply when you use them, and we
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
          The Mad Lads name, logos, art, photos, videos and the design of this site belong to Backpack or to the people who made them. You’re welcome to share
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
          <li>pretend to be Mad Lads, Backpack or anyone on the team.</li>
        </ul>
      </>
    ),
  },
  {
    id: "holders",
    title: "Holder area",
    body: (
      <p>
        A holder-only area with Matrica login is coming. When it opens, extra terms may apply to it, and we will update this page.
      </p>
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
