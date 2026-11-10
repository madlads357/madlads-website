// The hidden spots of the caravan: things to click. Where they are, and what they are called.
// Find SPOTS_NEEDED of them and the passport gets its "Curious" stamp.

export type SpotId = "fock" | "ball" | "crow" | "lamp" | "window" | "cat" | "candles" | "teapot";

export const SPOTS_NEEDED = 4; // out of 8: on a phone part of the table (and most of the window) is out of sight, so not all of them can be reached there

export const SPOT_LABEL: Record<SpotId, string> = {
  fock: "Madame Fock",
  ball: "The crystal ball",
  crow: "The crow",
  lamp: "The lamp",
  window: "The window",
  cat: "The cat",
  candles: "The candles",
  teapot: "The teapot",
};

// Things painted into the room picture: [left, top, width, height] in pixels of that picture. They are mapped to the screen with
// the same "cover" that the background uses (see useSpots), so they stay on their object whatever the shape of the window.
export const BG_SPOTS = {
  wide: { size: [1536, 1024], crow: [140, 165, 180, 150], lamp: [1060, 225, 250, 340], window: [1255, 130, 215, 340] },
  tall: { size: [1024, 1536], crow: [70, 300, 190, 200], lamp: [660, 390, 240, 340], window: [830, 200, 190, 450] },
} as const;

// Things painted into the table picture: [left, top, width, height] in percent of the table.
export const TABLE_SPOTS = {
  teapot: [1, 10, 12, 40],
  candles: [10.5, 0, 11.5, 52],
  ball: [61.5, 6, 13.5, 44],
  cat: [74, 2, 24, 36],
  deck: [38.4, 26, 21.6, 36], // the deck itself draws the card
} as const;
