// Lore chapters — draft copy from content/lore.md (facts from the Mad News "Rewind" issues).
// TODO: review with the community manager before launch.

export type Chapter = {
  slug: string;
  number: string;
  title: string;
  dates: string;
  body: string;
  moments: string[];
  image: { src: string; alt: string };
};

export const loreIntro =
  "From a wild mint in April 2023 to the flagship of Backpack — how a crew of 10,000 misfits took over Solana. Told in chapters, as it happened.";

export const chapters: Chapter[] = [
  {
    slug: "the-mint",
    number: "01",
    title: "The Mint",
    dates: "April 2023",
    body: "Coral — the team behind the Backpack wallet — drops 10,000 Mad Lads as the first collection of executable NFTs (xNFTs). The mint is pure chaos: more than 10,000 people pack the Twitter Space to follow it live. A community of builders, degens and Solana OGs is born overnight.",
    moments: [
      "Mar 27, 2023 — The Mad Validator goes live, later passing 500k staked SOL",
      "Apr 2023 — 10,000 Lads, Lassies and Skulls minted on Solana",
      "Mad Merch NFTs ship real hoodies and tees to holders worldwide",
    ],
    image: { src: "/lads/9366.jpg", alt: "Mad Lad #9366 in a fedora on a red background" },
  },
  {
    slug: "soul-and-skulls",
    number: "02",
    title: "Soul & Skulls",
    dates: "Summer 2023",
    body: "Armani Ferrante explains “soul abstraction”: every Lad gets its own soulbound inventory, so rewards and airdrops live on the NFT itself. Staking goes live, Sunday Streams become a ritual, and the rare Skulls — under 1% of the collection — start their reign.",
    moments: [
      "Jun 2023 — Meltem Demirors and Toly receive the first honorary 1/1s",
      "Jun 2023 — Staking and soulbound inventory go live",
      "Mad Skull #4862 sells for a record 1,000 SOL",
      "Aug 2023 — Blackfish becomes the first Lad of the Week",
    ],
    image: { src: "/lads/1846.jpg", alt: "Mad Skull #1846 with purple flames and a cigar" },
  },
  {
    slug: "x-stands-for-redacted",
    number: "03",
    title: "X stands for [REDACTED]",
    dates: "Fall 2023",
    body: "A cryptic teaser sets crypto Twitter on fire: “X stands for [REDACTED]”. Behind it, the team is building something much bigger than a wallet. Meanwhile the Lads win a spot on a Williams F1 car and take over Breakpoint in Amsterdam.",
    moments: [
      "Sep 2023 — Mad Lads win the race for the rear wing of a Williams F1 car",
      "Sep 2023 — MadderCrab David becomes an honorary Lad",
      "Nov 2023 — Seven Mad artists sent to Breakpoint Amsterdam",
      "Nov 2023 — Backpack Exchange opens with 100,000+ on the waitlist",
    ],
    image: { src: "https://madlads.s3.us-west-2.amazonaws.com/images/9969.png", alt: "Glitched Lassie #9969 in neon glitch colors" },
  },
  {
    slug: "lads-everywhere",
    number: "04",
    title: "Lads everywhere",
    dates: "2024",
    body: "Backpack Exchange becomes one of the fastest-growing exchanges in crypto, and the Lads go mainstream. Honoraries land with Iggy Azalea, Mert and Haliey Welch, collection locking makes Lads among the safest NFTs on Solana, and meetups pop up from Tokyo to Buenos Aires.",
    moments: [
      "Jan 2024 — Backpack Exchange, the fastest-growing CEX in crypto",
      "2024 — Iggy Azalea, Mert and Haliey Welch join as honoraries",
      "Collection locking protects Lads from wallet drainers",
      "Mad Lads meetups across Asia, Europe and the Americas",
    ],
    image: { src: "https://madlads.s3.us-west-2.amazonaws.com/images/9970.png", alt: "“Mother”, the honorary Lassie of Iggy Azalea" },
  },
  {
    slug: "brick-by-brick",
    number: "05",
    title: "Brick by brick",
    dates: "2025 — 2026",
    body: "Backpack spreads its wings: Backpack EU, new seasons, Mad Lads jackets shipping to holders, and finally the Backpack token. In April 2026 the Lads celebrate three years — and the story is just getting started.",
    moments: [
      "2025 — Backpack EU launches, Seasons 1 to 4 reward the community",
      "2025 — Mad Lads bomber jackets ship to holders",
      "Mar 23, 2026 — Backpack TGE",
      "Apr 2026 — Mad Lads turn three",
    ],
    image: { src: "https://madlads.s3.us-west-2.amazonaws.com/images/8420.png", alt: "The Mad King #8420 in golden armor" },
  },
];
