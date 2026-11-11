// Fills the holder map with made-up holders, to see how it looks with data (development only).
//   npm run db:seed-map -- --yes             adds about 1,100 test holders (re-running replaces them)
//   npm run db:seed-map -- --few --yes       adds only 30 test holders (10 in Europe, 10 in the US, 10 in Asia), one pin each
//   npm run db:seed-map -- --remove --yes    removes every test holder again
// Test holders have ids like "test:12" and are the only rows this script ever touches. It runs against
// DATABASE_URL (from .env.local): check it is your development database, which is why --yes is needed.
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (in the environment or .env.local).");
  process.exit(1);
}
const remove = process.argv.includes("--remove");
if (!process.argv.includes("--yes")) {
  console.error(`This ${remove ? "removes" : "adds"} test holders in the database at ${new URL(url).host}.\nRun again with --yes if that is your development database.`);
  process.exit(1);
}

const sql = neon(url);
await sql`delete from holder_accounts where holder_id like 'test:%'`;
await sql`delete from holder_settings where holder_id like 'test:%'`;
await sql`delete from holder_locations where holder_id like 'test:%'`;
if (remove) {
  console.log("Test holders removed.");
  process.exit(0);
}

// City, country, how many holders. Real cities from the same list the pin search uses (data/cities.json).
const cities = JSON.parse(readFileSync("data/cities.json", "utf8")); // [name, ascii, cc, region, lat, lng, pop]
const find = (name, cc) => cities.find((c) => c[0] === name && c[2] === cc);
const few = process.argv.includes("--few");
const fewSpots = [
  ["Amsterdam", "NL", 1], ["Paris", "FR", 1], ["London", "GB", 1], ["Berlin", "DE", 1], ["Lisbon", "PT", 1], ["Barcelona", "ES", 1], ["Rome", "IT", 1], ["Stockholm", "SE", 1], ["Warsaw", "PL", 1], ["Vienna", "AT", 1],
  ["New York City", "US", 1], ["Los Angeles", "US", 1], ["San Francisco", "US", 1], ["Miami", "US", 1], ["Austin", "US", 1], ["Chicago", "US", 1], ["Seattle", "US", 1], ["Denver", "US", 1], ["Boston", "US", 1], ["Atlanta", "US", 1],
  ["Tokyo", "JP", 1], ["Seoul", "KR", 1], ["Singapore", "SG", 1], ["Hong Kong", "HK", 1], ["Bangkok", "TH", 1], ["Taipei", "TW", 1], ["Mumbai", "IN", 1], ["Hanoi", "VN", 1], ["Manila", "PH", 1], ["Kuala Lumpur", "MY", 1],
];
const spots = few ? fewSpots : [
  ["Tokyo", "JP", 38], ["Osaka", "JP", 9], ["Amsterdam", "NL", 30], ["Utrecht", "NL", 6], ["Paris", "FR", 24], ["Lyon", "FR", 4], ["Hanoi", "VN", 16], ["Ho Chi Minh City", "VN", 8],
  ["New York City", "US", 22], ["Los Angeles", "US", 14], ["San Francisco", "US", 12], ["Miami", "US", 9], ["Austin", "US", 7], ["Chicago", "US", 5], ["Lisbon", "PT", 13], ["Porto", "PT", 3],
  ["London", "GB", 18], ["Manchester", "GB", 4], ["Berlin", "DE", 11], ["Munich", "DE", 5], ["Seoul", "KR", 10], ["Singapore", "SG", 12], ["Sydney", "AU", 7], ["Melbourne", "AU", 5],
  ["Toronto", "CA", 8], ["Vancouver", "CA", 4], ["São Paulo", "BR", 7], ["Rio de Janeiro", "BR", 3], ["Buenos Aires", "AR", 5], ["Mexico City", "MX", 5], ["Dubai", "AE", 8], ["Istanbul", "TR", 7],
  ["Mumbai", "IN", 5], ["Bengaluru", "IN", 4], ["Lagos", "NG", 4], ["Cape Town", "ZA", 3], ["Nairobi", "KE", 2], ["Cairo", "EG", 2], ["Bangkok", "TH", 7], ["Denpasar", "ID", 4],
  ["Madrid", "ES", 8], ["Barcelona", "ES", 9], ["Rome", "IT", 5], ["Milan", "IT", 4], ["Warsaw", "PL", 4], ["Prague", "CZ", 3], ["Vienna", "AT", 3], ["Zürich", "CH", 4], ["Stockholm", "SE", 3],
  ["Copenhagen", "DK", 3], ["Helsinki", "FI", 2], ["Athens", "GR", 3], ["Tel Aviv", "IL", 3], ["Taipei", "TW", 5], ["Hong Kong", "HK", 6], ["Manila", "PH", 4], ["Kuala Lumpur", "MY", 3],
  ["Auckland", "NZ", 2], ["Bogotá", "CO", 3], ["Santiago", "CL", 2], ["Lima", "PE", 2],
];
// Plus a scatter of smaller cities, one to three holders each.
const small = few ? [] : cities.filter((c) => c[6] > 150_000).slice(60, 400);

let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const names = ["Kai", "Mika", "Juno", "Rex", "Nova", "Zed", "Pixel", "Sol", "Ace", "Blaze", "Echo", "Fable", "Gus", "Hex", "Indy", "Jinx", "Koda", "Lux", "Mox", "Nix"];

const rows = [];
for (const [name, cc, n] of spots) {
  const c = find(name, cc);
  if (!c) {
    console.warn("Not in the city list, skipped:", name, cc);
    continue;
  }
  for (let i = 0; i < n; i++) rows.push(c);
}
for (const c of small) for (let i = 0, n = 1 + Math.floor(rand() * 3); i < n; i++) rows.push(c);

// One insert per table (unnest of arrays), all in one transaction: a few requests instead of a thousand, and never half-done.
const holders = { id: [], city: [], country: [], lat: [], lng: [], lad: [], show: [], since: [] };
const discord = { id: [], account: [], name: [] };
rows.forEach((c, n) => {
  const id = n + 1;
  holders.id.push(`test:${id}`);
  holders.city.push(c[0]);
  holders.country.push(c[2]);
  holders.lat.push(c[4]);
  holders.lng.push(c[5]);
  holders.show.push(rand() < 0.72);
  holders.lad.push(1 + Math.floor(rand() * 9971));
  holders.since.push(new Date(Date.UTC(2023, 3, 1) + Math.floor(rand() * 1000) * 86_400_000).toISOString().slice(0, 10)); // MAD LADS minted in April 2023
  if (rand() < 0.6) {
    discord.id.push(`test:${id}`);
    discord.account.push(`test-${id}`);
    discord.name.push(`${names[id % names.length]} ${id}`);
  }
});
await sql.transaction([
  sql`insert into holder_locations (holder_id, city, country, lat, lng, lad, show_identity)
      select * from unnest(${holders.id}::text[], ${holders.city}::text[], ${holders.country}::text[], ${holders.lat}::float8[], ${holders.lng}::float8[], ${holders.lad}::int[], ${holders.show}::bool[])`,
  sql`insert into holder_settings (holder_id, since) select * from unnest(${holders.id}::text[], ${holders.since}::date[])`,
  sql`insert into holder_accounts (holder_id, provider, account_id, name)
      select id, 'discord', account, name from unnest(${discord.id}::text[], ${discord.account}::text[], ${discord.name}::text[]) as t(id, account, name)`,
]);
console.log(`${rows.length} test holders added in ${new Set(rows.map((c) => c[0] + c[2])).size} cities. Remove them with: npm run db:seed-map -- --remove --yes`);
