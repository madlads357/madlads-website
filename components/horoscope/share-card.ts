// The picture a holder can download and post: the card, a line of the reading, the mood, on the share backdrop (1080 x 1350).
// Drawn in the browser on a canvas, from the same pictures as the page, so it costs nothing and the reading never leaves the browser.
import { thumbImage } from "@/lib/madlads";
import type { Reading } from "@/lib/horoscope";
import { BANNER } from "./geometry";

// Where the arched window and the plates sit on card-front.webp, as fractions of the card (horoscope.css uses the same numbers).
export const CARD_ART = { left: 0.092, top: 0.123, width: 0.82, height: 0.627 };
const PLATE_Y = 0.066; // the Roman numeral

const W = 1080;
const H = 1350;

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });

// A stretchable frame: the four corners keep their size, the edges and the middle stretch (like CSS border-image).
function nineSlice(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, slice: number, corner: number) {
  const sw = img.width - slice * 2;
  const sh = img.height - slice * 2;
  const dw = w - corner * 2;
  const dh = h - corner * 2;
  const parts: [number, number, number, number, number, number, number, number][] = [
    [0, 0, slice, slice, x, y, corner, corner],
    [slice, 0, sw, slice, x + corner, y, dw, corner],
    [img.width - slice, 0, slice, slice, x + w - corner, y, corner, corner],
    [0, slice, slice, sh, x, y + corner, corner, dh],
    [slice, slice, sw, sh, x + corner, y + corner, dw, dh],
    [img.width - slice, slice, slice, sh, x + w - corner, y + corner, corner, dh],
    [0, img.height - slice, slice, slice, x, y + h - corner, corner, corner],
    [slice, img.height - slice, sw, slice, x + corner, y + h - corner, dw, corner],
    [img.width - slice, img.height - slice, slice, slice, x + w - corner, y + h - corner, corner, corner],
  ];
  for (const [sx, sy, sw2, sh2, dx, dy, dw2, dh2] of parts) ctx.drawImage(img, sx, sy, sw2, sh2, dx, dy, dw2, dh2);
}

// Wraps text to a width: returns the lines.
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// Writes text along a quadratic curve, letter by letter (the middle of the text on the middle of the curve).
function arcText(ctx: CanvasRenderingContext2D, text: string, p0: readonly number[], p1: readonly number[], p2: readonly number[], size: number) {
  const at = (t: number) => ({
    x: (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    y: (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
    dx: 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]),
    dy: 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]),
  });
  const N = 300;
  const length: number[] = [0]; // how far along the curve each sample is
  for (let i = 1; i <= N; i++) {
    const a = at((i - 1) / N);
    const b = at(i / N);
    length.push(length[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const gap = size * 0.02;
  const widths = [...text].map((ch) => ctx.measureText(ch).width + gap);
  let s = length[N] / 2 - widths.reduce((a, b) => a + b, 0) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  [...text].forEach((ch, i) => {
    const mid = s + widths[i] / 2;
    s += widths[i];
    let k = length.findIndex((l) => l >= mid);
    if (k < 0) k = N;
    const p = at(k / N);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.atan2(p.dy, p.dx));
    ctx.fillText(ch, 0, size * 0.34);
    ctx.restore();
  });
}

export async function drawShareCard({ reading, number, lad, site, display, body }: { reading: Reading; number: string; lad: number; site: string; display: string; body: string }): Promise<Blob> {
  // the Lad comes through the site's own image route, so the canvas is never "tainted" by another domain
  const portraitUrl = `/_next/image?url=${encodeURIComponent(thumbImage(lad))}&w=640&q=75`;
  const [bg, frame, parchment, portrait] = await Promise.all([
    load("/horoscope/share-bg.webp"),
    load("/horoscope/card-front.webp"),
    load("/horoscope/parchment.webp"),
    load(portraitUrl),
    document.fonts.load(`800 40px ${display}`),
    document.fonts.load(`italic 500 30px ${body}`),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No canvas");

  // the backdrop, covering the whole picture
  const k = Math.max(W / bg.width, H / bg.height);
  ctx.drawImage(bg, (W - bg.width * k) / 2, (H - bg.height * k) / 2, bg.width * k, bg.height * k);

  // the card
  const cw = 560;
  const ch = (cw * frame.height) / frame.width;
  const cx = (W - cw) / 2;
  const cy = 64;
  const ax = cx + CARD_ART.left * cw;
  const ay = cy + CARD_ART.top * ch;
  const aw = CARD_ART.width * cw;
  const ah = CARD_ART.height * ch;
  ctx.save();
  ctx.beginPath(); // the arch: a half-ellipse on top of a rectangle
  const ry = ah * 0.39;
  ctx.moveTo(ax, ay + ry);
  ctx.ellipse(ax + aw / 2, ay + ry, aw / 2, ry, 0, Math.PI, 0);
  ctx.lineTo(ax + aw, ay + ah);
  ctx.lineTo(ax, ay + ah);
  ctx.closePath();
  ctx.clip();
  const pk = Math.max(aw / portrait.width, ah / portrait.height);
  ctx.drawImage(portrait, ax + (aw - portrait.width * pk) / 2, ay + (ah - portrait.height * pk) * 0.2, portrait.width * pk, portrait.height * pk);
  ctx.restore();
  ctx.drawImage(frame, cx, cy, cw, ch);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#5a3a12";
  ctx.font = `800 30px ${display}`;
  ctx.fillText(number, cx + cw / 2, cy + PLATE_Y * ch);
  // the name, on the curve of the banner (the same curve as on the page, scaled to the card on the picture)
  const name = reading.card.name.toUpperCase();
  const scale = cw / frame.width;
  const size = Math.min(40, 285 / (name.length * 0.8)) * scale;
  ctx.font = `800 ${size}px ${display}`;
  ctx.fillStyle = "#4a2a0a";
  const onCard = (p: readonly number[]) => [cx + p[0] * scale, cy + p[1] * scale];
  arcText(ctx, name, onCard(BANNER.p0), onCard(BANNER.p1), onCard(BANNER.p2), size);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // the reading, on a parchment panel
  const px = 90;
  const pw = W - px * 2;
  const py = cy + ch + 28;
  const ph = H - py - 92;
  nineSlice(ctx, parchment, px, py, pw, ph, 90, 64);
  ctx.fillStyle = "#3b2410";
  ctx.font = `italic 500 40px ${body}`;
  const lines = wrap(ctx, `“${reading.omen}”`, pw - 190);
  const lh = 48;
  const block = lines.length * lh + 56;
  let ty = py + ph / 2 - block / 2 + lh / 2;
  for (const line of lines) {
    ctx.fillText(line, W / 2, ty);
    ty += lh;
  }
  ctx.fillStyle = "#8a1d27";
  ctx.font = `800 24px ${display}`;
  ctx.fillText(`MOOD: ${reading.mood.toUpperCase()}`, W / 2, ty + 18);

  // the footer
  ctx.fillStyle = "#e2b45a";
  ctx.font = `600 26px ${display}`;
  ctx.fillText(`MAD LADS  ·  ${site}`, W / 2, H - 46);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No picture"))), "image/png"));
}
