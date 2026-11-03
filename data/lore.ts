// Lore chapters: the Mad Lads story, high level, with the culture moments that made it.
// Sources: Mad News (news.madlads.com: "The Mad Mint", the "Rewind" issues, issue #82, the monthly
// issues) and the Mad Lads Culture Hub history (madlads-hub.xyz/history). Photos and screenshots come
// from those pages and live in /public/lore. Tweet cards quote the original posts word for word
// (text from X's public embed data); their `image` is the post's own picture or video thumbnail.
// `moments` use "Date — event"; the page splits on " — " and shows the date in its own column.
// TODO: final read with the community manager before launch.

export type LoreImage = { kind: "image"; src: string; w: number; h: number; alt: string; caption: string };
export type LoreTweet = {
  kind: "tweet";
  name: string;
  handle: string;
  avatar?: string;
  date: string;
  text: string;
  url?: string;
  image?: { src: string; w: number; h: number; alt: string };
};
export type LoreMedia = LoreImage | LoreTweet;

export type Chapter = {
  slug: string;
  number: string;
  title: string;
  dates: string;
  body: string;
  moments: string[];
  image: { src: string; alt: string };
  media: LoreMedia[];
};

export const loreIntro =
  "From a chaotic mint in April 2023 to the Backpack token in 2026: how 10,000 misfits became the flagship of Backpack, one Mad moment at a time.";

const img = (src: string, w: number, h: number, caption: string, alt: string): LoreImage => ({ kind: "image", src, w, h, caption, alt });

export const chapters: Chapter[] = [
  {
    slug: "the-mint",
    number: "01",
    title: "The Mint",
    dates: "April 2023",
    body: "Coral, the team behind the Backpack wallet, opens the mint at 6.9 SOL, only inside the Backpack app. Within minutes it turns into a war: DDoS attacks, extortion demands, broken RPCs and armies of bots. The team traps the bots in a honeypot, sends their SOL back within a day and finishes the mint anyway. Out of that chaos comes the motto: fock it.",
    moments: [
      "Feb 2023 — The beanbag photo becomes a meme",
      "Apr 19, 2023 — The Madlist mint opens at 6.9 SOL",
      "Apr 20, 2023 — A massive DDoS pushes the public mint back",
      "Apr 21, 2023 — Public mint, and a honeypot for the bots",
    ],
    image: { src: "/lads/9366.jpg", alt: "Mad Lad #9366 in a fedora on a red background" },
    media: [
      {
        kind: "tweet",
        name: "Mad Lads",
        handle: "MadLads",
        avatar: "/lore/avatars/MadLads.jpg",
        date: "Apr 20, 2023",
        text: "Today, the public mint at 7pm ET will ONLY be in backpack.app/download.\n\nThere will be NO links to mint. It will be in the banner of the NFT tab in the Backpack extension.",
        url: "https://x.com/MadLads/status/1649162832120774659",
        image: { src: "/lore/tweet-mint.jpg", w: 1080, h: 1080, alt: "Backpack wallet showing a balance of 6.9 SOL" },
      },
      img("/lore/mint-trending.jpg", 1100, 1210, "Backpack, DDOS and Mad Lads, trending at the same time", "X trending list showing Backpack, DDOS and Mad Lads"),
      {
        kind: "tweet",
        name: "Armani Ferrante",
        handle: "armaniferrante",
        avatar: "/lore/avatars/armaniferrante.jpg",
        date: "Apr 20, 2023",
        text: "Billions of requests. Things that went wrong.\n\n- crushed by ddos (and extortion)\n- coingecko api down\n- twitter spaces broken\n- cloudflare ui broken\n- rpc node 1 data center rugged\n- rpc node 2 unable to handle capacity\n- bots trying to rug the public phase\n\nFock it.",
        url: "https://x.com/armaniferrante/status/1649226410903437314",
      },
      img("/lore/mint-coindesk.jpg", 943, 405, "CoinDesk: “Heavy demand for Madlads NFT breaks internet, delays mint”", "CoinDesk headline about the Mad Lads mint being delayed by demand"),
      img("/lore/beanbag-photo.jpg", 1160, 2058, "The beanbag photo, February 2023", "The team working from beanbags in an office, surrounded by snacks"),
      img("/lore/mint-decrypt.jpg", 935, 352, "Decrypt on the honeypot that caught the bots", "Decrypt headline about how Mad Lads tricked bots into spending $250K on fake NFTs"),
    ],
  },
  {
    slug: "a-soul-for-every-lad",
    number: "02",
    title: "A soul for every Lad",
    dates: "Summer 2023",
    body: "Staking and a soulbound inventory go live inside Backpack, so rewards live on the NFT itself. Mad Merch ships to holders around the world, Mad News starts, and Armani’s Sunday Streams become a ritual. The first honorary 1/1s go to Solana legends, and the first meetups start in Vietnam.",
    moments: [
      "Jun 2023 — Staking and soulbound inventory go live",
      "Jun 2023 — Meltem Demirors and Toly receive the first honoraries",
      "Jul 2023 — Mad Merch ships, Mert joins the honoraries",
      "Aug 2023 — Blackfish becomes the first Lad of the Week",
    ],
    image: { src: "/lore/merch-hoodie.jpg", alt: "The black Mad Lads Edition 1 hoodie with Fock it written on it" },
    media: [
      img("/lore/staking-art.jpg", 1344, 823, "Staking goes live: rewards land on the Lad itself", "Illustration of a Mad Lad sleeping on a pile of gold coins"),
      img("/lore/first-honoraries.jpg", 1112, 878, "The first two honoraries, for Meltem Demirors and Toly", "Two tweets showing the honorary Mad Lads of Meltem Demirors and Anatoly Yakovenko"),
      img("/lore/sunday-stream.jpg", 1400, 790, "Armani’s Sunday Streams", "Armani Ferrante smiling on a Sunday Stream"),
      img("/lore/saga-engraving.jpg", 1191, 795, "Mad Lads engraved on the Solana Saga phone", "Two Solana Saga phones with a Mad Lad laser engraved on the back"),
      img("/lore/vietnam-breakfast.jpg", 1400, 784, "GM Vietnam: the first meetup, with Superteam", "Poster for the Mad Lads breakfast meetup in Vietnam with Superteam"),
    ],
  },
  {
    slug: "rear-wings-and-rickrolls",
    number: "03",
    title: "Rear wings & Rickrolls",
    dates: "Fall 2023",
    body: "The Lads turn every vote into a raid. They win Kraken’s #RearWingTakeover, and Mad Lad #8731 rides the rear wing of a Williams F1 car at the Austin Grand Prix. Holders wait for big October news and get Rickrolled instead. Meanwhile, collection locking makes Lads among the safest NFTs on Solana.",
    moments: [
      "Sep 2023 — MadderCrab David becomes an honorary Lad",
      "Oct 2023 — The Rickroll: “See you at Breakpoint”",
      "Oct 2023 — Collection locking goes live, #LadsOnLock",
      "Oct 2023 — Mad Lad #8731 on a Williams F1 rear wing in Austin",
    ],
    image: { src: "/lore/f1-vote.jpg", alt: "Rear Wing Takeover voting card with Mad Lad #8731" },
    media: [
      img("/lore/f1-rear-wing.jpg", 1400, 1052, "The Williams rear wing, covered in the winning community PFPs", "Rear wing of the Williams F1 car covered with community profile pictures"),
      img("/lore/f1-wing-closeup.jpg", 812, 556, "Mad Lad #8731, up close on the wing", "Close-up of the F1 rear wing with the Mad Lad artwork"),
      img("/lore/rickroll.jpg", 948, 662, "October’s big announcement", "The Mad Lads website playing Rick Astley with the words See you at Breakpoint"),
      img("/lore/collection-lock.jpg", 497, 390, "Lock Mad Lads collection: one switch in Backpack", "Backpack wallet screen with the Lock Mad Lads collection switch turned on"),
    ],
  },
  {
    slug: "x-stands-for-redacted",
    number: "04",
    title: "X stands for [REDACTED]",
    dates: "November 2023",
    body: "A cryptic “X stands for [REDACTED]” teaser and crypto Twitter starts guessing. X stands for eXchange: Backpack Exchange opens with a Dubai license, and Mad Lads holders are first in line. The same month, the Lads take over Breakpoint Amsterdam with Skull standees, piles of swag and the Fock it playing cards.",
    moments: [
      "Oct 2023 — The “X stands for [REDACTED]” teaser",
      "Nov 2023 — Breakpoint Amsterdam, 500+ pieces of swag in the first hours",
      "Nov 2023 — Backpack Exchange opens its doors",
      "Nov 2023 — A $PYTH airdrop for Mad Lads holders",
    ],
    image: { src: "/lore/breakpoint-booth.jpg", alt: "The Backpack booth at Breakpoint Amsterdam with two Mad Skull standees and Fock it cards" },
    media: [
      img("/lore/breakpoint-amsterdam.jpg", 1290, 650, "Mad Lads Amsterdam", "Illustration of Mad Lads walking through a foggy Amsterdam street"),
      img("/lore/fock-it-cards.jpg", 1400, 649, "The Fock it playing cards, with Mad Lads as the face cards", "Mad Lads playing card deck with Lads and Lassies on the cards"),
      img("/lore/exchange-first-users.jpg", 734, 724, "First reviews of Backpack Exchange", "Tweets from early users praising the Backpack Exchange sign-up"),
    ],
  },
  {
    slug: "laddrop-season",
    number: "05",
    title: "Laddrop season",
    dates: "Early 2024",
    body: "2024 opens with airdrop after airdrop. Holding a Lad means badges in its soulbound inventory, then tokens from Wormhole, Dymension, Parcl, Sharky and more. And the Lads take the show on the road: a pop-up in Seoul, NFT.NYC in Times Square, a token-gated Discord filling up live during TOKEN2049 Dubai, a nightclub in Manila and a first birthday in Tokyo.",
    moments: [
      "Mar 2024 — The Wormhole badge lands in eligible Lads",
      "Mar 2024 — The Mad Seoul pop-up",
      "Apr 2024 — Tristan on the TOKEN2049 stage in Dubai",
      "May 2024 — One year of Mad Lads, celebrated in Tokyo",
      "May 2024 — Iggy Azalea receives her honorary Lassie",
    ],
    image: { src: "/lore/seoul-popup.jpg", alt: "Red Mad Lads backpacks and a glowing Mad Lads sign at the Seoul pop-up" },
    media: [
      img("/lore/wormhole-badge.jpg", 790, 1200, "The Wormhole badge, right inside the Lad", "xNFT inventory of a Mad Lad showing the Wormhole badge"),
      img("/lore/seoul-takeover-merch.jpg", 1090, 1090, "Seoul Takeover merch: bottles, backpacks and a Mad cocktail", "Custom Mad Lads Nalgene bottle, backpack, cushion and cocktail for the Seoul Takeover"),
      img("/lore/nft-nyc.jpg", 680, 511, "NFT.NYC, Lads in disguise", "Group of holders in New York with Mad Lads faces drawn over theirs"),
      img("/lore/token2049-dubai.jpg", 1400, 1052, "“Creating Culture & Community” at TOKEN2049 Dubai", "Tristan Yver on stage at TOKEN2049 Dubai in front of a giant Discord screen"),
      img("/lore/tokyo-madiversary.jpg", 740, 717, "Happy Madiversary in Tokyo", "Holders and Mad Lads posters at the one-year anniversary in Tokyo"),
      img("/lore/manila-night.jpg", 735, 365, "A nightclub takeover in Manila", "Mad Lads artwork and a neon sign in a Manila nightclub"),
      img("/lore/istanbul-meetup.jpg", 738, 717, "Istanbul, with Jito and Superteam Turkey", "Holders in Mad Lads shirts at a meetup by the Bosphorus in Istanbul"),
      img("/lore/rickroll-badge.jpg", 680, 556, "Badges of honor: even the Rickroll got one", "Mad Lad inventory with badges next to a Rick Astley image"),
      img("/lore/iggy-honorary.jpg", 1400, 473, "“Mother”, Iggy Azalea’s honorary Lassie", "Banner of the honorary Lassie Mother blowing bubble gum"),
    ],
  },
  {
    slug: "lads-everywhere",
    number: "06",
    title: "Lads everywhere",
    dates: "Late 2024",
    body: "Armani headlines the Solana Summit in Kuala Lumpur, and the meetups never stop: Hanoi, Taipei, then Ho Chi Minh City, Madrid and Lagos on the very same September day. Haliey Welch becomes honorary #6, holders get a custom Keystone wallet, and Pudgy Penguins send $PENGU to the Lads. At the end of the year, co-founder Tristan Yver steps back to an advisory role.",
    moments: [
      "Jun 2024 — Armani on stage at the Solana Summit in Kuala Lumpur",
      "Aug 2024 — Mad Night in Taipei, and Haliey Welch becomes honorary #6",
      "Sep 2024 — Ho Chi Minh City, Madrid and Lagos meet up on the same day",
      "Dec 2024 — $PENGU for the Lads",
      "Dec 2024 — Co-founder Tristan Yver moves to an advisory role",
    ],
    image: { src: "/lore/taipei-mad-night.jpg", alt: "Collage of the Taipei Mad Night party with holders, Mad Lads signs and Backpack swag" },
    media: [
      img("/lore/solana-summit-armani.jpg", 1400, 1748, "Armani, speaker at the Solana Summit in Kuala Lumpur", "Solana Summit speaker card for Armani Ferrante with his Mad Lad"),
      img("/lore/hcmc-meetup.jpg", 637, 498, "200+ holders in Ho Chi Minh City", "Tweet with photos of the Mad Lads and Backpack venue in Ho Chi Minh City"),
      img("/lore/madrid-meetup.jpg", 640, 627, "A token-gated night in Madrid", "Tweet with photos of the Mad Lads event in Madrid"),
      img("/lore/lagos-meetup.jpg", 550, 800, "Mad Lads Africa, Lagos", "Mad Lads Lagos backdrop with a backpack and Lads illustrations"),
      img("/lore/haliey-honorary.jpg", 720, 900, "Haliey Welch, honorary #6", "Honorary Mad Lassie of Haliey Welch in a cowboy hat"),
      img("/lore/keystone-wallet.jpg", 1400, 1660, "A custom Keystone hardware wallet for holders", "Keystone hardware wallet with a Mad Lassie printed on the back"),
      img("/lore/pengu-fock-it.jpg", 1280, 1280, "Pudgy Penguins send $PENGU, in a Fock it hoodie", "Pudgy Penguin wearing a red Mad Lads beanie and a Fock it hoodie"),
      img("/irl/edition-1-office.jpg", 1200, 1600, "Tristan selfie", "Tristan taking a selfie in an office while someone behind points at the Mad Lads Edition 1 hoodie"),
    ],
  },
  {
    slug: "we-are-one",
    number: "07",
    title: "We are one",
    dates: "2024–2025",
    body: "WAO, We Are One, stops being a slogan. Two holders get married in September 2024, another Lads couple says yes in Da Nang, and a third union follows. Holders build their own tools too: the Dressing Room filters go viral, then grow into the Mad Lads Culture Hub. And every week, a Lad of the Week gets the spotlight.",
    moments: [
      "Sep 2024 — The first Mad Lads wedding",
      "Jan 2025 — The Culture Hub, born from the viral Dressing Room filters",
      "Apr 2025 — Two years of Mad Lads, and a wedding in Da Nang",
      "Dec 2025 — A third Mad union",
    ],
    image: { src: "/lore/mad-proposal.jpg", alt: "A holder in a Mad Lads bomber proposing on a bridge at night" },
    media: [
      img("/lore/mad-mariage.jpg", 1240, 1748, "The Da Nang wedding invitation, April 2025", "Wedding invitation of Fomo Shark and Lassie An in Da Nang, April 19, 2025"),
      img("/lore/first-wedding.jpg", 572, 753, "“WE ARE ONE.” A Mad Lads giveaway at the first wedding", "Tweet from the bride sharing Mad Lads gifts prepared for the wedding guests"),
      img("/lore/culture-hub.jpg", 1400, 754, "The Mad Lads Culture Hub: Dressing Room, History, Roster and Mad Memes", "Home screen of the Mad Lads Culture Hub with four red tiles"),
      img("/lore/two-years.jpg", 1351, 1081, "Two years of madness", "Red poster with stamps celebrating two years of Mad Lads"),
    ],
  },
  {
    slug: "brick-by-brick",
    number: "08",
    title: "Brick by brick",
    dates: "2025",
    body: "Backpack builds. It acquires FTX EU, launches Backpack EU and runs four trading Seasons that reward its community. The Lads get their own bomber jacket, the MAD Tour stops in Madrid and Paris, and Armani keeps teasing merch, down to a pair of Mad Lads Vans.",
    moments: [
      "Jan 2025 — Backpack acquires FTX EU",
      "Feb 2025 — The MAD Tour in Madrid and Paris",
      "Mar 2025 — Season 1 of Backpack Exchange begins",
      "Jul 2025 — The Mad Lads bomber jackets ship",
      "Sep 2025 — Backpack EU launches with Season 3",
    ],
    image: { src: "/lore/bomber-delivered.jpg", alt: "The Mad Lads bomber jacket unboxed next to Mad Lads plushies and a pool table" },
    media: [
      img("/lore/mad-tour-madrid.jpg", 1400, 933, "The MAD Tour: “Not for everyone. For the mad ones only.”", "Illustration of a Lad with a red backpack looking at Madrid for the MAD Tour"),
      img("/lore/mad-tour-paris.jpg", 1400, 774, "The red bags line up at NFT Paris", "Row of holders with red Backpack bags in front of the Grande Halle de la Villette"),
      img("/lore/seasons-coming.jpg", 1400, 641, "“The seasons are coming.”", "Illustration of a Lad pointing a sword at a cave full of gold"),
      img("/irl/bomber-teaser.jpg", 1200, 1600, "Armani teasing the bomber, March 2025", "Armani seen from behind wearing the black Mad Lads bomber jacket"),
      img("/lore/vans-teaser.jpg", 675, 900, "Mad Lads x Vans?", "A Vans sneaker with a Mad Lad painted on the side"),
      img("/lore/dubai-night.jpg", 1366, 2048, "Backpack x Mad Lads night in Dubai", "Backpack poster in a Dubai venue at night"),
    ],
  },
  {
    slug: "three-years-mad",
    number: "09",
    title: "Three years Mad",
    dates: "2026",
    body: "The Backpack token goes live on March 23, 2026, with 1% of the supply set aside for Mad Lads holders and no allocation at launch for founders, team or VCs. The community celebrates from Hanoi to Tokyo, Mad Coach takes over as community manager, and four weeks later the Lads turn three. Then Backpack goes after Wall Street: a US-regulated brokerage, tokenized stocks and the first 24/7 market for US equities. The story is just getting started.",
    moments: [
      "Jan 2026 — The token plan: 1% for Mad Lads holders",
      "Mar 23, 2026 — $BP goes live on Solana",
      "Apr 2026 — Mad Coach becomes community manager",
      "Apr 20, 2026 — Mad Lads turn three",
      "Jun 2026 — Backpack Securities: tokenized US stocks on Solana",
      "Jul 2026 — The first 24/7 market for US equities",
    ],
    image: { src: "https://madlads.s3.us-west-2.amazonaws.com/images/8420.png", alt: "The Mad King #8420 in golden armor" },
    media: [
      {
        kind: "tweet",
        name: "Solana",
        handle: "solana",
        avatar: "/lore/avatars/solana.jpg",
        date: "Mar 23, 2026",
        text: "BREAKING: $BP, the official @Backpack token, is live on Solana",
        url: "https://x.com/solana/status/2036061369796276634",
        image: { src: "/lore/tweet-bp-live.jpg", w: 1200, h: 674, alt: "BP is live on Solana, on a red and black background" },
      },
      img("/lore/we-are-one.jpg", 679, 377, "The token plan, with a share for Points and Mad Lads", "Chart of the Backpack token distribution with Points and Mad Lads"),
      {
        kind: "tweet",
        name: "Mad Mibu",
        handle: "MinhTranQuang10",
        avatar: "/lore/avatars/MinhTranQuang10.jpg",
        date: "Apr 7, 2026",
        text: "We are MAD, lads! @MadLads @Backpack\n\nWAO 🎒💪",
        url: "https://x.com/MinhTranQuang10/status/2041559623040430328",
        image: { src: "/lore/tweet-mibu.jpg", w: 675, h: 1200, alt: "Mad Mibu on stage at a Mad Lads night in Vietnam" },
      },
      img("/lore/japan-community-event.jpg", 900, 1200, "Backpack community event in Japan, after the TGE", "Two attendees with red Backpack bags in front of a Backpack logo projection"),
      img("/lore/coach-cm.jpg", 1226, 309, "Armani on Discord: Mad Coach steps in as community manager", "Discord announcement from Armani about Mad Coach becoming the Mad Lads community manager"),
      {
        kind: "tweet",
        name: "Mad Lads",
        handle: "MadLads",
        avatar: "/lore/avatars/MadLads.jpg",
        date: "Apr 20, 2026",
        text: "3 YEARS.",
        url: "https://x.com/MadLads/status/2046112849336967654",
        image: { src: "/lore/tweet-3-years.jpg", w: 1200, h: 675, alt: "A hand reaching for an old cassette player on a sunlit desk" },
      },
      img("/lore/us-equities-24-7.jpg", 1400, 733, "Backpack launches the first 24/7 market for US equities", "Backpack Securities announcement with a clock"),
      img("/lore/mad-news-april-2026.jpg", 1400, 933, "Mad News, April 2026", "Mad News April 2026 cover with Mad Skulls walking through a burning city"),
      img("/irl/fock-it-car.jpg", 940, 566, "Fock it, on four wheels", "Orange BMW coupe wrapped in Mad Lads and Backpack livery"),
    ],
  },
];
