// The Mad Lads collection on the server: read once from public/data/madlads.json (the same file the
// browser loads), with how many Lads share each trait value. Used by the Lad pages and share links.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Collection } from "@/lib/madlads";

type Indexed = Collection & {
  byId: Map<number, number[]>;
  counts: number[][]; // counts[trait][value] = how many Lads have it
};

let cache: Indexed | null = null;

export function collection(): Indexed {
  if (cache) return cache;
  const c = JSON.parse(readFileSync(join(process.cwd(), "public/data/madlads.json"), "utf8")) as Collection;
  const counts = c.traits.map((t) => new Array<number>(t.values.length).fill(0));
  for (const l of c.lads) c.traits.forEach((_, ti) => l[ti + 1] >= 0 && counts[ti][l[ti + 1]]++);
  cache = { ...c, byId: new Map(c.lads.map((l) => [l[0], l])), counts };
  return cache;
}

// One Lad's traits, in collection order, with how rare each value is.
export function ladTraits(id: number) {
  const c = collection();
  const lad = c.byId.get(id);
  if (!lad) return null;
  return c.traits
    .map((t, ti) => {
      const vi = lad[ti + 1];
      if (vi < 0) return null;
      const count = c.counts[ti][vi];
      return { name: t.name, value: t.values[vi], count, share: count / c.lads.length };
    })
    .filter((t): t is { name: string; value: string; count: number; share: number } => t !== null);
}
