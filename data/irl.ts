// "Beyond the screen" — Mad Lads in real life.
// Photos: Mad News newsletter (news.madlads.com), stored in /public/irl.
// Videos: "Community Meetups" playlist on the Backpack Exchange YouTube channel
// (https://www.youtube.com/playlist?list=PL5McVW5kQe0rKlmLqLqhpiWKtHBLQLOk_).
// Captions only state what the sources say. Usage rights confirmed by the team.

export type IrlPhoto = { src: string; alt: string; caption: string; where: string; w: number; h: number };
export type IrlVideo = { id: string; title: string; where: string };

export const irlPhotos: IrlPhoto[] = [
  { src: "/irl/breakpoint-amsterdam-booth.jpg", w: 1600, h: 2132, where: "Amsterdam", caption: "The MAD LADS booth at Breakpoint", alt: "MAD LADS and Backpack booth at Breakpoint Amsterdam with two Skull standees" },
  { src: "/irl/mount-fuji.jpg", w: 544, h: 680, where: "Mount Fuji", caption: "LADS on top of Mt Fuji", alt: "Group of MAD LADS holders with a flag at the summit of Mount Fuji" },
  { src: "/irl/nft-paris-2025.jpg", w: 800, h: 442, where: "Paris", caption: "The red bags line up at NFT Paris 2025", alt: "Row of MAD LADS holders with red Backpack bags in front of the Grande Halle de la Villette at NFT Paris 2025" },
  { src: "/irl/hanoi-meetup.jpg", w: 1282, h: 964, where: "Hanoi", caption: "The first community meetup in Vietnam", alt: "Group photo of MAD LADS holders in Hanoi holding painted MAD LADS canvases" },
  { src: "/irl/shibuya.jpg", w: 421, h: 520, where: "Tokyo", caption: "Repping at the Shibuya crossing", alt: "Person in a MAD LADS hoodie standing in the Shibuya crossing in Tokyo" },
  { src: "/irl/bomber-teaser.jpg", w: 1200, h: 1600, where: "Sneak peek", caption: "Armani teasing the MAD LADS bomber", alt: "Armani seen from behind on a city sidewalk, wearing a black MAD LADS bomber jacket" },
  { src: "/irl/rooftop.jpg", w: 1600, h: 1066, where: "Around the world", caption: "A rooftop full of LADS", alt: "Crowd of MAD LADS holders with red Backpack bags at a rooftop party" },
  { src: "/irl/lads-wedding.jpg", w: 1495, h: 2048, where: "Another LADS union", caption: "When two LADS say yes", alt: "Couple in MAD LADS clothing on a lit bridge at night" },
  { src: "/irl/tokyo-anniversary.jpg", w: 1288, h: 1324, where: "Tokyo", caption: "One year of MAD LADS", alt: "MAD LADS holders celebrating the first anniversary in Tokyo" },
  { src: "/irl/edition-1-office.jpg", w: 1200, h: 1600, where: "Behind the scenes", caption: "Tristan selfie", alt: "Tristan taking a selfie in an office with a city view, while someone behind points at the MAD LADS Edition 1 print on his hoodie" },
  { src: "/irl/yellowstone.jpg", w: 680, h: 562, where: "Around the world", caption: "Far from the chain, still MAD", alt: "Person in a MAD LADS hoodie in front of a geothermal landscape" },
  { src: "/irl/fock-it-car.jpg", w: 940, h: 566, where: "Vietnam", caption: "Fock it, on four wheels", alt: "Orange BMW coupe wrapped in MAD LADS and Backpack livery with Fock it on the doors and windshield" },
  { src: "/irl/breakpoint-amsterdam-crowd.jpg", w: 883, h: 826, where: "Amsterdam", caption: "The booth, packed all day long", alt: "Crowd gathered around the MAD LADS booth at Breakpoint" },
  { src: "/irl/nba-arena.jpg", w: 578, h: 680, where: "Around the world", caption: "Courtside with the jacket", alt: "MAD LADS bomber jacket seen from behind in a basketball arena" },
  { src: "/irl/pub-cardboard-lads.jpg", w: 979, h: 776, where: "Around the world", caption: "Pub time with the LADS", alt: "Friends at a pub table surrounded by cardboard MAD LADS cut-outs" },
  { src: "/irl/tokyo-sticker.jpg", w: 1348, h: 1458, where: "Tokyo", caption: "Spotted in the streets", alt: "MAD LADS sticker on a pole in a Tokyo street" },
  { src: "/irl/fock-it-hoodie.jpg", w: 1536, h: 2048, where: "Singapore", caption: "Fock it, in real life", alt: "Holder wearing a black hoodie with Fock it written on it" },
];

export const irlVideos: IrlVideo[] = [
  { id: "w3JGqKwo5e0", title: "MAD LADS Meetup at Sexyland", where: "Amsterdam" },
  { id: "dmSz-ueNcBs", title: "MAD LADS Meetup", where: "Seoul" },
  { id: "lgYZZ2f955g", title: "MAD LADS × La Familia Party", where: "Madrid" },
  { id: "GJJaNEHAmsY", title: "MAD LADS Meetup during Token 2049", where: "Singapore" },
  { id: "vciCPuYJm2g", title: "Asia Blockchain Summit Meetup", where: "Taipei" },
  { id: "8JvKQxOyxbo", title: "Solana Crossroads MAD LADS Meetup", where: "Turkey" },
  { id: "E8aoE-hd22w", title: "MAD LADS Meetup with Superteam", where: "Philippines" },
  { id: "IzihjidjyqE", title: "MAD LADS Korea Connect", where: "Korea" },
];

export const irlPlaylist = "https://www.youtube.com/playlist?list=PL5McVW5kQe0rKlmLqLqhpiWKtHBLQLOk_";
