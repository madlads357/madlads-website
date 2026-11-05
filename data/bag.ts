import { links } from "@/data/site";

// What falls out of the holder's backpack on the profile page (/holders), in order.
// Add an object: drop its image in public/holders/bag/ (transparent WebP) and add a line here.
//   open: "passport"  opens the Lads Passport (a window on the page)
//         "memes"     opens the meme vault (a window on the page)
//         "dressing"  opens the Dressing Room (a window on the page)
//         "playlist"  opens the playlist, Spotify's player (a window on the page)
//         a URL       opens that page in a new tab
//         null        not available yet: shown greyed out with "Soon"
const windows = ["passport", "memes", "dressing", "playlist"] as const;
export type BagWindow = (typeof windows)[number];
export const isBagWindow = (open: string | null): open is BagWindow => (windows as readonly (string | null)[]).includes(open);

export type BagItem = {
  id: string;
  label: string;
  hint: string; // one short line under the label
  image: string;
  w: number;
  h: number;
  open: BagWindow | string | null;
  tilt: number; // resting angle once it has landed, in degrees
  scale?: number; // evens out how big objects look (wide ones read small, tall ones big); 1 = default
};

const HUB = "https://www.madlads-hub.xyz"; // the Culture Hub, until it moves into the holder area

export const bagItems: BagItem[] = [
  { id: "passport", label: "Passport", hint: "Your MAD LADS Passport", image: "/holders/bag/passport.webp", w: 491, h: 560, open: "passport", tilt: -6, scale: 1 },
  { id: "dressing", label: "Dressing room", hint: "Dress up your LADS", image: "/holders/bag/hanger.webp", w: 460, h: 560, open: "dressing", tilt: 6, scale: 1 },
  { id: "news", label: "MAD News", hint: "The monthly newsletter", image: "/holders/bag/newspaper.webp", w: 560, h: 286, open: links.newsletter, tilt: -3, scale: 1 },
  { id: "discord", label: "Discord", hint: "Talk to the LADS", image: "/holders/bag/walkie-talkie.webp", w: 391, h: 560, open: links.discord, tilt: 8, scale: 1.15 },
  { id: "playlist", label: "Playlist", hint: "The MAD LADS mix", image: "/holders/bag/cassette.webp", w: 560, h: 378, open: "playlist", tilt: 5, scale: 0.96 },
  { id: "games", label: "Games", hint: "Mini-games, high scores", image: "/holders/bag/games.webp", w: 479, h: 560, open: `${HUB}/mini-game`, tilt: -4, scale: 1 },
  { id: "memes", label: "Memes", hint: "The community meme vault", image: "/holders/bag/memes.webp", w: 496, h: 560, open: "memes", tilt: 7, scale: 1 },
];
