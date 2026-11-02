#!/usr/bin/env node
// Rebuilds public/data/madlads.json from the official Mad Lads metadata on S3
// (https://madlads.s3.us-west-2.amazonaws.com/json/{id}.json). No dependencies.
//
//   npm run data:madlads                 # all Lads (#1 – #9971)
//   node scripts/build-madlads-data.mjs --to 50 --out /tmp/test.json   # quick test
//
// Output format (kept small on purpose, ~90 KB gzipped):
//   { source, traits: [{ name, values[] }], lads: [[id, valueIndex per trait | -1]] }
// Values are sorted by frequency; trait order is fixed (see ORDER), unknown traits are appended.

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const FROM = Number(args.from ?? 1);
const TO = Number(args.to ?? 9971);
const OUT = resolve(args.out ?? "public/data/madlads.json");
const CONCURRENCY = Number(args.concurrency ?? 24);
const BASE = "https://madlads.s3.us-west-2.amazonaws.com/json";

const ORDER = ["Type", "Gender", "Background", "Expression", "Eyes", "Clothing", "Hair", "Hat", "Smoking", "Smoke", "Hand", "Glove", "Mouth", "Mustache", "Back", "Necklace"];

async function fetchLad(id, tries = 4) {
  for (let t = 1; t <= tries; t++) {
    try {
      const r = await fetch(`${BASE}/${id}.json`);
      if (r.status === 404 || r.status === 403) return null; // not in the collection
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      return Object.fromEntries((j.attributes ?? []).map((a) => [a.trait_type, String(a.value)]));
    } catch (e) {
      if (t === tries) throw new Error(`#${id}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 500 * t));
    }
  }
}

const ids = Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i);
const results = new Map();
let done = 0;
async function worker() {
  while (ids.length) {
    const id = ids.shift();
    const attrs = await fetchLad(id);
    if (attrs) results.set(id, attrs);
    if (++done % 500 === 0) process.stdout.write(`  ${done} / ${TO - FROM + 1}\n`);
  }
}
console.log(`Fetching Mad Lads #${FROM}–#${TO} from S3…`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// Traits: fixed order first, then anything new.
const names = [...ORDER];
for (const attrs of results.values()) for (const k of Object.keys(attrs)) if (!names.includes(k)) names.push(k);
const usedNames = names.filter((n) => [...results.values()].some((a) => n in a));

const traits = usedNames.map((name) => {
  const freq = new Map();
  for (const a of results.values()) if (name in a) freq.set(a[name], (freq.get(a[name]) ?? 0) + 1);
  return { name, values: [...freq.entries()].sort((x, y) => y[1] - x[1]).map(([v]) => v) };
});
const index = traits.map((t) => new Map(t.values.map((v, i) => [v, i])));
const lads = [...results.entries()]
  .sort((a, b) => a[0] - b[0])
  .map(([id, a]) => [id, ...traits.map((t, ti) => (t.name in a ? index[ti].get(a[t.name]) : -1))]);

const json = JSON.stringify({ source: `${BASE}/{id}.json`, traits, lads });
await writeFile(OUT, json);
console.log(`Wrote ${lads.length} Lads, ${traits.length} traits → ${OUT} (${Math.round(json.length / 1024)} KB)`);
