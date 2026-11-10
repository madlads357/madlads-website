// The MAD Horoscope: turns (a holder, a day) into one reading. Pure: no database, no outside service, no cost.
// The same holder gets the same reading all day (UTC), and a new one at midnight UTC. The words are in data/horoscope.ts.
// One exception: the occasional extra line is about what the holder holds (tier, Skull, Lassie, 1/1), so if they buy or sell
// mid-day that one line can change. The card, the omen, Do, Avoid and the mood never do.
import { READER, advice, byKind, byTier, cards, moods, omens, warnings } from "@/data/horoscope";

export type Reading = {
  date: string; // the UTC day it is for, YYYY-MM-DD
  card: { name: string; meaning: string };
  omen: string;
  advice: string; // after "Do"
  warning: string; // after "Avoid"
  mood: string;
  extra?: string; // sometimes: a line about the kind of Lad held, or how many
};

// What the extra line can talk about.
export type Holdings = { count: number; skull?: boolean; lassie?: boolean; oneOfOne?: boolean };

// A string → a 32-bit number (two mixed hashes folded together), then a small seeded random generator (mulberry32):
// the same seed always draws the same numbers.
function hash(s: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const fill = (line: string) => line.replaceAll("{reader}", READER);

// The reading for this holder on this UTC day. `holderId` is the session id: it only seeds the draw and is never shown.
export function readingFor(holderId: string, date: string, held: Holdings): Reading {
  const next = random(hash(`mad-horoscope|${holderId}|${date}`));
  const pick = <T,>(list: T[]) => list[Math.floor(next() * list.length)];

  const card = pick(cards);
  const omen = pick(omens);
  const adviceLine = pick(advice);
  const warning = pick(warnings);
  const mood = pick(moods);

  // About one reading in three gets an extra line: about the kind of Lad, or about how many.  The page is short on purpose.
  const tier = held.count >= 20 ? byTier.legend : held.count >= 5 ? byTier.crew : byTier.holder;
  const pool = [...tier, ...(held.skull ? byKind.skull : []), ...(held.lassie ? byKind.lassie : []), ...(held.oneOfOne ? byKind.oneOfOne : [])];
  const extra = next() < 0.35 ? fill(pick(pool)) : undefined;

  return { date, card, omen, advice: adviceLine, warning, mood, extra };
}
