// Cuts the Mad Horoscope pictures (mockup_chatgpt/horoscope/*.png, made with ChatGPT) into the pieces the page uses
// (public/horoscope/*.webp). Usage: node scripts/build-horoscope-assets.mjs
// The cut-outs were drawn on a flat magenta (#FF00FF) background: that colour is removed here, with a soft edge,
// and the magenta fringe the edge leaves is taken out. The big sheets are split into one file per piece.
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "mockup_chatgpt/horoscope";
const OUT = "public/horoscope";
mkdirSync(OUT, { recursive: true });

const webp = { quality: 84, alphaQuality: 100, effort: 5 };

// The curves in components/horoscope/geometry.ts and the places in horoscope.css were measured on pieces of these sizes.
// If the sources are redrawn and a piece comes out another size, they have to be measured again (see geometry.ts).
const MEASURED_ON = { "card-front": [484, 805], title: [870, 399], easel: [449, 623], parchment: [895, 522], table: [1536, 637] };

// Removes the magenta: transparent where it is, partly transparent on the soft edge, no pink left on the edge.
async function cutOut(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = new Uint8ClampedArray(data);
  const n = W * H;
  const alpha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const d = Math.hypot(255 - r, g, 255 - b); // distance to pure magenta
    alpha[i] = d < 70 ? 0 : d > 120 ? 1 : (d - 70) / 50;
  }
  // The edge: pixels next to a transparent one lose their magenta tint (a dark outline mixed with magenta turns dark again).
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (alpha[i] === 0) continue;
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && alpha[ny * W + nx] === 0) { near = true; break; }
      }
      if (!near) continue;
      const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
      const spill = Math.min(r, b) - g;
      if (spill > 25) {
        px[i * 4] = Math.max(0, r - spill * 0.75);
        px[i * 4 + 2] = Math.max(0, b - spill * 0.75);
      }
    }
  }
  for (let i = 0; i < n; i++) px[i * 4 + 3] = Math.round(alpha[i] * 255);
  return { px, W, H };
}

const toSharp = ({ px, W, H }) => sharp(Buffer.from(px.buffer), { raw: { width: W, height: H, channels: 4 } });

// Saves a region of a cut-out as its own file, trimmed to what is drawn.
async function save(cut, name, box, resizeWidth) {
  let img = toSharp(cut);
  if (box) img = img.extract({ left: box[0], top: box[1], width: box[2] - box[0], height: box[3] - box[1] });
  const buf = await img.png().toBuffer();
  let out = sharp(buf).trim({ threshold: 1 });
  if (resizeWidth) out = out.resize({ width: resizeWidth, withoutEnlargement: true });
  const info = await out.webp(webp).toFile(`${OUT}/${name}.webp`);
  const want = MEASURED_ON[name];
  const flag = want && (want[0] !== info.width || want[1] !== info.height) ? `  <-- was ${want[0]}x${want[1]} when the curves were measured: measure them again` : "";
  console.log(name.padEnd(14), `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)} KB${flag}`);
}

// The room: plain pictures, no cut-out.
for (const [src, name] of [["scene-wide", "scene-wide"], ["scene-tall", "scene-tall"], ["share", "share-bg"]]) {
  const info = await sharp(`${SRC}/${src}.png`).webp({ quality: 80, effort: 5 }).toFile(`${OUT}/${name}.webp`);
  console.log(name.padEnd(14), `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)} KB`);
}

// The table, Madame Fock (three poses side by side), the cards (front, back), the interface pieces.
await save(await cutOut(`${SRC}/table.png`), "table");

const fock = await cutOut(`${SRC}/fock.png`);
// the three poses are separated by empty columns: cut at the middle of each gap
const cols = new Array(fock.W).fill(0);
for (let y = 0; y < fock.H; y++) for (let x = 0; x < fock.W; x++) if (fock.px[(y * fock.W + x) * 4 + 3] > 200) cols[x]++;
const gaps = [];
for (let x = 0, start = -1; x <= fock.W; x++) {
  const empty = x === fock.W || cols[x] === 0;
  if (empty && start < 0) start = x;
  if (!empty && start >= 0) { if (x - start > 12 && start > 0) gaps.push(Math.round((start + x) / 2)); start = -1; }
}
console.log("fock gaps at", gaps.join(", "));
const cuts = [0, ...gaps.slice(0, 2), fock.W];
for (const [i, name] of ["fock-wink", "fock-rest", "fock-card"].entries()) await save(fock, name, [cuts[i], 0, cuts[i + 1], fock.H]);

const cards = await cutOut(`${SRC}/card-front-and-back.png`);
await save(cards, "card-front", [0, 0, 512, cards.H]);
await save(cards, "card-back", [512, 0, cards.W, cards.H]);

const ui = await cutOut(`${SRC}/ui.png`);
await save(ui, "parchment", [40, 20, 1000, 580]);
await save(ui, "easel", [1000, 0, 1500, 660]);
await save(ui, "title", [60, 560, 980, 1010]); // the title banner with its blank ribbon underneath (the date goes on it)
