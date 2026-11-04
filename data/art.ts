// Team-made 1/1s and special pieces.
// Official originals come straight from the Mad Lads S3 bucket (resized on the fly by next/image):
//   images/{n}.png      — minted Lads (#8420 King, #9968–9971 later 1/1s)
//   honoraries/{n}.png  — Honorary Mad Lads #1–5
// Pieces that only exist in the Mad News newsletter or the team's posts are stored in /public/art.

import { originalImage } from "@/lib/madlads";

export type ArtPiece = {
  src: string;
  kind: string;
  name: string;
  alt: string;
};

const honorary = (n: number) => `https://madlads.s3.us-west-2.amazonaws.com/honoraries/${n}.png`;

export const king: ArtPiece = {
  src: originalImage(8420),
  kind: "The only King · #8420",
  name: "The MAD King",
  alt: "The MAD King: a MAD LADS in golden armor and a horned crown before a royal rug",
};

export const honoraries: ArtPiece[] = [
  { src: originalImage(9970), kind: "Honorary Lassie · #9970", name: "Iggy Azalea", alt: "“Mother”, the honorary Lassie of Iggy Azalea" },
  { src: honorary(2), kind: "Honorary Lad #2", name: "Toly", alt: "Honorary MAD LADS of Anatoly Yakovenko in a Solana cap" },
  { src: honorary(1), kind: "Honorary Lassie #1", name: "Meltem Demirors", alt: "Honorary Lassie of Meltem Demirors with a katana" },
  { src: "/art/honorary_mert.jpg", kind: "Honorary Lad", name: "Mert, without the hat", alt: "Honorary MAD LADS of Mert breathing fire" },
];

export const moreOneOfOnes: ArtPiece[] = [
  { src: honorary(4), kind: "Honorary Lad #4", name: "Austin Federa", alt: "Honorary MAD LADS of Austin Federa with his cat Elote" },
  { src: honorary(5), kind: "Honorary Lad #5", name: "MadderCrab David", alt: "Honorary diamond Skull of MadderCrab David (thehasheddude)" },
  { src: "/art/1of1_scarface.jpg", kind: "1/1 tribute", name: "Scarface", alt: "MAD LADS 1/1 tribute to Scarface" },
  { src: originalImage(9969), kind: "1/1 · Tensor raffle · #9969", name: "Glitched Lassie", alt: "Glitched Lassie #9969 in a studded leather jacket, her face split in neon glitch colors" },
  { src: originalImage(9971), kind: "Honorary Lassie · #9971", name: "Haliey Welch", alt: "Honorary Lassie of Haliey Welch in a cowboy hat" },
  { src: originalImage(9968), kind: "1/1 · Pyth raffle · #9968", name: "Pythia Lassie", alt: "Pythia Lassie #9968, a hooded Lassie in purple with violet eyes" },
];

export const specials = {
  cards: { src: "/art/special_playing-cards.png", kind: "Special", name: "MAD LADS playing cards", alt: "MAD LADS playing card deck and box" },
  preview: { src: "/art/preview_art-of-mad-lads.png", kind: "Preview", name: "The Art of MAD LADS, by @yannpenno", alt: "Sketch and colored artwork of a Lassie with a sword" },
  sketches: { src: "/art/sketches_yannpenno.png", kind: "Sketches", name: "Character studies by @yannpenno", alt: "Pencil character studies of Lassies" },
  merch: { src: "/art/merch_jacket.jpg", kind: "Merch", name: "MAD LADS jacket & goodies", alt: "MAD LADS jacket, socks and plush toys on a pool table" },
} satisfies Record<string, ArtPiece>;
