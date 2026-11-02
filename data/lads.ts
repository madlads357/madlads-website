// Homepage preview set: 20 Mad Lads with images in /public/lads.
// Traits come from the official madlads.com gallery metadata (the full collection lives in
// /public/data/madlads.json — see scripts/build-madlads-data.mjs).

export type LadType = "Light" | "Dark" | "Android" | "Galaxy" | "Skull" | "King";

export type Lad = {
  id: number;
  type: LadType;
  gender: "Male" | "Female";
  background: string | null;
  clothing: string | null;
  eyes: string | null;
};

export const lads: Lad[] = [
  {
    "id": 9366,
    "type": "Light",
    "gender": "Male",
    "background": "Red",
    "clothing": "Bloody Windsor",
    "eyes": "Brown"
  },
  {
    "id": 4144,
    "type": "Dark",
    "gender": "Female",
    "background": "Purple",
    "clothing": "Lace Blouse",
    "eyes": "Brown"
  },
  {
    "id": 1846,
    "type": "Skull",
    "gender": "Male",
    "background": "Red",
    "clothing": "Classic",
    "eyes": "Purple"
  },
  {
    "id": 9866,
    "type": "Android",
    "gender": "Male",
    "background": "Yellow",
    "clothing": "General Uniform",
    "eyes": "Android"
  },
  {
    "id": 5655,
    "type": "Dark",
    "gender": "Female",
    "background": "Yellow",
    "clothing": "Black Rebel Jacket",
    "eyes": "Green"
  },
  {
    "id": 2784,
    "type": "Light",
    "gender": "Male",
    "background": "Purple",
    "clothing": "Tattoo Lads Jersey",
    "eyes": "Blue"
  },
  {
    "id": 638,
    "type": "Android",
    "gender": "Female",
    "background": "Pink",
    "clothing": "Lace Blouse",
    "eyes": "Android"
  },
  {
    "id": 7245,
    "type": "Skull",
    "gender": "Male",
    "background": "White",
    "clothing": "Pinstripes",
    "eyes": "Purple"
  },
  {
    "id": 886,
    "type": "Light",
    "gender": "Male",
    "background": "Orange",
    "clothing": "Three Piece",
    "eyes": "Green"
  },
  {
    "id": 4209,
    "type": "Light",
    "gender": "Female",
    "background": "Yellow",
    "clothing": "Rosa Dress",
    "eyes": "Closed"
  },
  {
    "id": 1742,
    "type": "Android",
    "gender": "Male",
    "background": "Red",
    "clothing": "Dark Windsor",
    "eyes": "Android"
  },
  {
    "id": 2330,
    "type": "Light",
    "gender": "Female",
    "background": "Violet",
    "clothing": "Black Hoodie",
    "eyes": "Blue"
  },
  {
    "id": 956,
    "type": "Skull",
    "gender": "Male",
    "background": "White",
    "clothing": "Milord",
    "eyes": "Blue"
  },
  {
    "id": 5964,
    "type": "Light",
    "gender": "Male",
    "background": "Orange",
    "clothing": "Sealevel Coat",
    "eyes": "Closed"
  },
  {
    "id": 950,
    "type": "Light",
    "gender": "Female",
    "background": "White",
    "clothing": "Milkmaid Dress",
    "eyes": "Snake"
  },
  {
    "id": 3982,
    "type": "Dark",
    "gender": "Male",
    "background": "Violet",
    "clothing": "Bomber",
    "eyes": "Possessed"
  },
  {
    "id": 8003,
    "type": "Skull",
    "gender": "Male",
    "background": "Red",
    "clothing": "General Uniform",
    "eyes": "Green"
  },
  {
    "id": 7278,
    "type": "Light",
    "gender": "Male",
    "background": "Pink",
    "clothing": "Tuxedo",
    "eyes": "Closed"
  },
  {
    "id": 4310,
    "type": "Light",
    "gender": "Female",
    "background": "Grey",
    "clothing": "Milkmaid Dress",
    "eyes": "Blue"
  },
  {
    "id": 689,
    "type": "Android",
    "gender": "Male",
    "background": "Yellow",
    "clothing": "Solana Tuxedo",
    "eyes": "Android"
  }
];

export const ladImage = (id: number) => `/lads/${id}.jpg`;
