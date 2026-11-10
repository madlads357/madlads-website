// City search for the holder map (server-only). The list is GeoNames (geonames.org, CC BY 4.0): the cities of
// 15,000+ people, built by scripts/build-cities.mjs. Holders pick one of these, so a pin can only ever be a city
// centre, and nothing a holder types is sent to a third party.
import raw from "@/data/cities.json";

type Row = [name: string, ascii: string, country: string, region: string, lat: number, lng: number, pop: number];
export type CityHit = { city: string; country: string; region: string; lat: number; lng: number };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

let index: { key: string; row: Row }[] | null = null;
const load = () => (index ??= (raw as Row[]).map((row) => ({ key: norm(row[1] || row[0]), row }))); // already biggest first

// Cities whose name starts with `q` (accents and case ignored), then the ones with a word that does, biggest first.
export function searchCities(q: string, limit = 6): CityHit[] {
  const n = norm(q.slice(0, 60));
  if (n.length < 2) return [];
  const starts: CityHit[] = [];
  const words: CityHit[] = [];
  for (const { key, row } of load()) {
    const hit = () => ({ city: row[0], country: row[2], region: row[3], lat: row[4], lng: row[5] });
    if (key.startsWith(n)) starts.push(hit());
    else if (words.length < limit && key.includes(` ${n}`)) words.push(hit());
    if (starts.length >= limit) break;
  }
  return [...starts, ...words].slice(0, limit);
}

// True if this exact city (name, country and centre) is in the list: the pin API only accepts those.
let known: Set<string> | null = null;
export const isKnownCity = (city: string, country: string, lat: number, lng: number) => {
  known ??= new Set((raw as Row[]).map((r) => `${r[0]}|${r[2]}|${r[4]}|${r[5]}`));
  return known.has(`${city}|${country}|${lat}|${lng}`);
};
