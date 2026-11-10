// Builds data/cities.json, the list the holder map's city search uses (lib/cities.ts).
// Source: GeoNames (geonames.org), CC BY 4.0: "cities15000.zip" (cities of 15,000+ people) and "admin1CodesASCII.txt".
// Usage: node scripts/build-cities.mjs <cities15000.txt> <admin1CodesASCII.txt>
// Districts (feature code PPLX) are left out.
// Each row: [name, ascii name or "" if the same, country code, region, lat, lng, population], biggest first.
import { readFileSync, writeFileSync } from "node:fs";

const [citiesFile, adminFile] = process.argv.slice(2);
if (!citiesFile || !adminFile) {
  console.error("Usage: node scripts/build-cities.mjs <cities15000.txt> <admin1CodesASCII.txt>");
  process.exit(1);
}

const regions = new Map();
for (const line of readFileSync(adminFile, "utf8").split("\n")) {
  const [code, , ascii] = line.split("\t");
  if (code && ascii) regions.set(code, ascii);
}

const rows = [];
for (const line of readFileSync(citiesFile, "utf8").split("\n")) {
  const f = line.split("\t");
  if (f.length < 15) continue;
  const [, name, ascii, , lat, lng, , code, cc, , admin1, , , , pop] = f;
  if (code === "PPLX") continue; // a district of a bigger city (Amsterdam-Zuid): the city itself is in the list
  if (/ \d{1,2}( |$)/.test(name)) continue; // "Paris 15 Vaugirard": the numbered districts of a city
  rows.push([name, ascii === name ? "" : ascii, cc, regions.get(`${cc}.${admin1}`) ?? "", Math.round(Number(lat) * 100) / 100, Math.round(Number(lng) * 100) / 100, Number(pop)]);
}
rows.sort((a, b) => b[6] - a[6]);
writeFileSync("data/cities.json", JSON.stringify(rows));
console.log(`${rows.length} cities written to data/cities.json`);
