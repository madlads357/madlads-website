// "Beyond the screen" — Mad Lads in real life.
// Photos: Mad News newsletter (news.madlads.com), stored in /public/irl.
// Videos: "Community Meetups" playlist on the Backpack Exchange YouTube channel
// (https://www.youtube.com/playlist?list=PL5McVW5kQe0rKlmLqLqhpiWKtHBLQLOk_).
// Captions only state what the sources say. TODO: confirm with the community manager.

export type IrlPhoto = { src: string; alt: string; caption: string; where: string; w: number; h: number };
export type IrlVideo = { id: string; title: string; where: string };

export const irlPhotos: IrlPhoto[] = [
  { src: "/irl/breakpoint-amsterdam-booth.jpg", w: 1600, h: 2132, where: "Amsterdam", caption: "The Mad Lads booth at Breakpoint", alt: "Mad Lads and Backpack booth at Breakpoint Amsterdam with two Skull standees" },
  { src: "/irl/mount-fuji.jpg", w: 544, h: 680, where: "Mount Fuji", caption: "Lads on top of Mt Fuji", alt: "Group of Mad Lads holders with a flag at the summit of Mount Fuji" },
  { src: "/irl/hanoi-meetup.jpg", w: 1282, h: 964, where: "Hanoi", caption: "The first community meetup in Vietnam", alt: "Group photo of Mad Lads holders in Hanoi holding painted Mad Lads canvases" },
  { src: "/irl/shibuya.jpg", w: 421, h: 520, where: "Tokyo", caption: "Repping at the Shibuya crossing", alt: "Person in a Mad Lads hoodie standing in the Shibuya crossing in Tokyo" },
  { src: "/irl/rooftop.jpg", w: 1600, h: 1066, where: "Around the globe", caption: "A rooftop full of Lads", alt: "Crowd of Mad Lads holders with red Backpack bags at a rooftop party" },
  { src: "/irl/lads-wedding.jpg", w: 1495, h: 2048, where: "Another Lads union", caption: "When two Lads say yes", alt: "Couple in Mad Lads clothing on a lit bridge at night" },
  { src: "/irl/tokyo-anniversary.jpg", w: 1288, h: 1324, where: "Tokyo", caption: "One year of Mad Lads", alt: "Mad Lads holders celebrating the first anniversary in Tokyo" },
  { src: "/irl/yellowstone.jpg", w: 680, h: 562, where: "Around the world", caption: "Far from the chain, still Mad", alt: "Person in a Mad Lads hoodie in front of a geothermal landscape" },
  { src: "/irl/breakpoint-amsterdam-crowd.jpg", w: 883, h: 826, where: "Amsterdam", caption: "The booth, mobbed all week", alt: "Crowd gathered around the Mad Lads booth at Breakpoint" },
  { src: "/irl/nba-arena.jpg", w: 578, h: 680, where: "Around the world", caption: "Courtside with the jacket", alt: "Mad Lads bomber jacket seen from behind in a basketball arena" },
  { src: "/irl/pub-cardboard-lads.jpg", w: 979, h: 776, where: "Around the world", caption: "Cardboard Lads joined the party", alt: "Friends at a pub table surrounded by cardboard Mad Lads cut-outs" },
  { src: "/irl/tokyo-sticker.jpg", w: 1348, h: 1458, where: "Tokyo", caption: "Spotted in the streets", alt: "Mad Lads sticker on a pole in a Tokyo street" },
  { src: "/irl/fock-it-hoodie.jpg", w: 1536, h: 2048, where: "Singapore", caption: "Fock it, in real life", alt: "Holder wearing a black hoodie with Fock it written on it" },
];

export const irlVideos: IrlVideo[] = [
  { id: "w3JGqKwo5e0", title: "Mad Lads Meetup at Sexyland", where: "Amsterdam" },
  { id: "dmSz-ueNcBs", title: "Mad Lads Meetup", where: "Seoul" },
  { id: "lgYZZ2f955g", title: "Mad Lads × La Familia Party", where: "Madrid" },
  { id: "GJJaNEHAmsY", title: "Mad Lads Meetup during Token 2049", where: "Singapore" },
  { id: "vciCPuYJm2g", title: "Asia Blockchain Summit Meetup", where: "Taipei" },
  { id: "8JvKQxOyxbo", title: "Solana Crossroads Mad Lads Meetup", where: "Turkey" },
  { id: "E8aoE-hd22w", title: "Mad Lads Meetup with Superteam", where: "Philippines" },
  { id: "IzihjidjyqE", title: "Mad Lads Korea Connect", where: "Korea" },
];

export const irlPlaylist = "https://www.youtube.com/playlist?list=PL5McVW5kQe0rKlmLqLqhpiWKtHBLQLOk_";
