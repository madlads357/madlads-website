// The passport reveal as an MP4 (1080×1080, ~6.5 s) and its last frame as a PNG, made entirely in the browser.
// Each frame is drawn on a canvas with the same art as the page (paper, worn ink, logo, stamps,
// the Lad photo), then encoded by the browser's own H.264 encoder through Mediabunny.
// The stamp drawings are taken from the passport already on the page (same SVGs, same order),
// so the video always matches what the holder sees.
//
// Timeline: closed cover (0–0.9 s) → cover turns on its spine and the book slides to the
// centre (0.9–2.1 s) → stamps land one by one (from 2.3 s) → hold on the open passport.
import { HORIZONTAL, STACKED } from "@/components/Logo";
import { thumbImage } from "@/lib/madlads";
import { identityFields } from "./format";
import type { PassportData } from "./Passport";

const SIZE = 1080;
const FPS = 30;
const DURATION = 6.5; // seconds
const PAGE_W = 470;
const PAGE_H = Math.round((PAGE_W * 125) / 88); // passport page ratio, as on the site
const SPREAD_X = (SIZE - PAGE_W * 2) / 2;
const SPREAD_Y = (SIZE - PAGE_H) / 2 + 14;
const CQ = PAGE_W / 100; // 1 "cqw" of the page, to reuse the page's proportions
// Stamp timing (seconds), shared by the picture and the sound: stamp i starts at START + i * GAP,
// lasts LAND, and hits the paper at 55 % of it (the "thump").
const STAMP = { start: 2.3, gap: 0.3, land: 0.42, hit: 0.55 };
const stampStart = (i: number) => STAMP.start + i * STAMP.gap;

const C = {
  bg: "#ede6da",
  paper: "#f6f1e8",
  cover: "#b31220",
  red: "#f62038",
  accent: "#c41129",
  ink: "#111111",
  muted: "#5c574f",
  line: "#e2dacc",
  cream: "#f6f1e8",
};
const X_LOGO =
  "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";

type Ctx = CanvasRenderingContext2D;
type Stamp = { img: HTMLCanvasElement; x: number; y: number; w: number; h: number; r: number; multiply: boolean };

/* ------------------------------------------------------------ helpers */

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // in-out
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// The site's font (Geist, loaded by next/font) by its real family name, for canvas text.
const family = () => getComputedStyle(document.documentElement).getPropertyValue("--font-geist-sans").trim() || "sans-serif";

function text(ctx: Ctx, s: string, x: number, y: number, size: number, opts: { weight?: number; color?: string; spacing?: number; align?: CanvasTextAlign; alpha?: number } = {}) {
  ctx.save();
  ctx.font = `${opts.weight ?? 700} ${size}px ${family()}`;
  ctx.fillStyle = opts.color ?? C.ink;
  ctx.textAlign = opts.align ?? "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = opts.alpha ?? 1;
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${(opts.spacing ?? 0) * size}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function paths(ctx: Ctx, list: string[], x: number, y: number, scale: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  for (const d of list) ctx.fill(new Path2D(d));
  ctx.restore();
}

// The page's @font-face (Geist) as a data URL, so the stamp SVGs keep their font once turned into images.
async function fontFace(): Promise<string> {
  const name = family().split(",")[0].replace(/["']/g, "").trim();
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of [...rules]) {
      if (!(rule instanceof CSSFontFaceRule) || rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim() !== name) continue;
      const url = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1];
      if (!url) continue;
      // the address is relative to the stylesheet, not to the page
      const blob = await (await fetch(new URL(url, sheet.href ?? location.href))).blob();
      const data = await new Promise<string>((r) => {
        const fr = new FileReader();
        fr.onload = () => r(fr.result as string);
        fr.readAsDataURL(blob);
      });
      return `@font-face{font-family:"${name}";src:url(${data}) format("woff2");font-weight:100 900;}`;
    }
  }
  return "";
}

// One stamp SVG from the page → an image at the given width, inked (worn texture) and coloured.
async function inkStamp(svg: SVGSVGElement, color: string, width: number, css: string, ink: HTMLImageElement, offset: [number, number], worn: boolean) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("style", `color:${color}`);
  const vb = svg.viewBox.baseVal;
  const height = Math.round((width * vb.height) / vb.width);
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `${css} text{font-family:${family()}}`;
  clone.insertBefore(style, clone.firstChild);
  const markup = new XMLSerializer().serializeToString(clone).replace(/var\(--font-sans\)/g, family().replace(/"/g, "'"));
  const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);

  const c = canvas(width, height);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  if (worn) {
    // keep the ink only where the texture is opaque: same worn look as the page
    ctx.globalCompositeOperation = "destination-in";
    const pattern = ctx.createPattern(ink, "repeat")!;
    pattern.setTransform(new DOMMatrix().translate(offset[0], offset[1]).scale(240 / ink.width));
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  }
  return c;
}

/* ------------------------------------------------------------ static layers */

function paperFill(ctx: Ctx, paper: HTMLImageElement, w: number, h: number) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  const p = ctx.createPattern(paper, "repeat")!;
  p.setTransform(new DOMMatrix().scale(420 / paper.width));
  ctx.fillStyle = p;
  ctx.fillRect(0, 0, w, h);
}

function coverLayer(paper: HTMLImageElement, coverStamp: HTMLCanvasElement) {
  const c = canvas(PAGE_W, PAGE_H);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = C.cover;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  // paper grain, greyed and multiplied: texture without tinting the red
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.35;
  const p = ctx.createPattern(paper, "repeat")!;
  p.setTransform(new DOMMatrix().scale(300 / paper.width));
  ctx.fillStyle = p;
  ctx.filter = "grayscale(1) contrast(2)";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  text(ctx, "LADS PASSPORT", PAGE_W / 2, 10 * CQ + 4.4 * CQ, 4.4 * CQ, { weight: 600, color: C.cream, spacing: 0.42, align: "center" });
  // embossed logo: a dark edge above, a light edge below
  const logoW = 44 * CQ;
  const s = logoW / 176;
  const lx = (PAGE_W - logoW) / 2;
  const ly = (PAGE_H - 191 * s) / 2;
  paths(ctx, STACKED, lx, ly - 1, s, "rgba(0,0,0,0.4)");
  paths(ctx, STACKED, lx, ly + 1.5, s, "rgba(255,255,255,0.2)");
  paths(ctx, STACKED, lx, ly, s, C.red);

  text(ctx, "EVERYONE’S MAD HERE.", 8 * CQ, PAGE_H - 10 * CQ, 3 * CQ, { weight: 600, color: C.cream, spacing: 0.3, alpha: 0.7 });
  ctx.save();
  ctx.translate(PAGE_W - 8 * CQ - coverStamp.width / 2, PAGE_H - 11 * CQ);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.globalAlpha = 0.85;
  ctx.drawImage(coverStamp, -coverStamp.width / 2, -coverStamp.height / 2);
  ctx.restore();
  return c;
}

async function identityLayer(data: PassportData, paper: HTMLImageElement, photo: HTMLImageElement) {
  const c = canvas(PAGE_W, PAGE_H);
  const ctx = c.getContext("2d")!;
  paperFill(ctx, paper, PAGE_W, PAGE_H);
  const left = 7 * CQ;
  let y = 8 * CQ;

  text(ctx, "LADS PASSPORT", left, y + 3.6 * CQ, 3.6 * CQ, { color: C.accent, spacing: 0.32 });
  paths(ctx, HORIZONTAL, PAGE_W - left - 22 * CQ, y + 0.3 * CQ, (22 * CQ) / 334, C.red);
  y += 3.6 * CQ + 7 * CQ;

  // photo, rounded
  const pw = 48 * CQ;
  const ph = (pw * 5) / 4;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, y, pw, ph, 2.4 * CQ);
  ctx.clip();
  const ratio = Math.max(pw / photo.width, ph / photo.height);
  ctx.drawImage(photo, left + (pw - photo.width * ratio) / 2, y + (ph - photo.height * ratio) / 2, photo.width * ratio, photo.height * ratio);
  ctx.restore();

  // Lad number beside the photo
  const nx = left + pw + 5 * CQ;
  text(ctx, "LAD NO.", nx, y + 1 * CQ + 2.8 * CQ, 2.8 * CQ, { weight: 600, color: C.accent, spacing: 0.2 });
  text(ctx, `#${data.photo}`, nx, y + 5 * CQ + 8 * CQ, 8 * CQ, { color: C.ink, spacing: -0.04 });
  const photoBottom = y + ph;
  y = photoBottom + 6 * CQ;

  // fields
  ctx.fillStyle = C.line;
  ctx.fillRect(left, y, PAGE_W - left * 2, 1);
  y += 4 * CQ;
  const colW = (PAGE_W - left * 2 - 5 * CQ) / 2;
  identityFields(data).forEach((f, i) => {
    const fx = left + (i % 2) * (colW + 5 * CQ);
    const fy = y + Math.floor(i / 2) * (3.4 * CQ + 0.8 * CQ + 4.6 * CQ * 1.25 + 3.5 * CQ);
    if (f.key === "x") paths(ctx, [X_LOGO], fx, fy, (3.2 * CQ) / 24, C.accent);
    else text(ctx, f.label.toUpperCase(), fx, fy + 2.8 * CQ, 2.8 * CQ, { weight: 600, color: C.accent, spacing: 0.2 });
    text(ctx, f.value, fx, fy + 3.4 * CQ + 0.8 * CQ + 4.6 * CQ, 4.6 * CQ, { color: C.ink, spacing: -0.02 });
  });

  text(ctx, "MADLADS.COM · FOCK IT.", PAGE_W / 2, PAGE_H - 8 * CQ, 2.6 * CQ, { weight: 600, color: C.muted, spacing: 0.34, align: "center" });
  return { canvas: c, photoBottom };
}

function stampsLayer(paper: HTMLImageElement) {
  const c = canvas(PAGE_W, PAGE_H);
  const ctx = c.getContext("2d")!;
  paperFill(ctx, paper, PAGE_W, PAGE_H);
  text(ctx, "STAMPS", 7 * CQ, 4 * CQ + 3 * CQ, 3 * CQ, { weight: 600, color: C.muted, spacing: 0.3 });
  return c;
}

/* ------------------------------------------------------------ frame */

function roundedPage(ctx: Ctx, layer: HTMLCanvasElement, x: number, y: number, w: number, outerLeft: boolean) {
  if (w <= 0.5) return;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, PAGE_H, outerLeft ? [16, 6, 6, 16] : [6, 16, 16, 6]);
  ctx.clip();
  ctx.drawImage(layer, x, y, w, PAGE_H);
  ctx.restore();
}

function drawStamp(ctx: Ctx, s: Stamp, originX: number, originY: number, t: number) {
  if (t <= 0) return;
  const k = clamp(t);
  // land: big and transparent → slightly squashed → settled (same as the page's "thump")
  const scale = k < STAMP.hit ? 1.9 - (1.9 - 0.93) * (k / STAMP.hit) : 0.93 + 0.07 * ((k - STAMP.hit) / (1 - STAMP.hit));
  ctx.save();
  ctx.globalAlpha = clamp(k / STAMP.hit);
  ctx.globalCompositeOperation = s.multiply ? "multiply" : "source-over";
  ctx.translate(originX + s.x + s.w / 2, originY + s.y + s.h / 2);
  ctx.rotate((s.r * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(s.img, -s.w / 2, -s.h / 2, s.w, s.h);
  ctx.restore();
}

/* ------------------------------------------------------------ sound */

// The soundtrack, synthesized (no audio file): a soft whoosh while the cover turns, then a
// "thump" each time a stamp hits the paper: a deep thud plus a short paper slap, each a little
// different in pitch so it sounds hand-stamped.
async function soundtrack(hits: number[]): Promise<AudioBuffer> {
  const rate = 48000;
  const ctx = new OfflineAudioContext(2, Math.ceil(DURATION * rate), rate);
  const master = ctx.createDynamicsCompressor();
  master.connect(ctx.destination);
  const noise = (seconds: number) => {
    const b = ctx.createBuffer(1, Math.ceil(seconds * rate), rate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = b;
    return src;
  };

  // whoosh: filtered noise sweeping up while the cover opens
  const w = noise(1.3);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(350, 0.85);
  band.frequency.exponentialRampToValueAtTime(2200, 2.0);
  const wg = ctx.createGain();
  wg.gain.setValueAtTime(0.0001, 0.85);
  wg.gain.exponentialRampToValueAtTime(0.16, 1.45);
  wg.gain.exponentialRampToValueAtTime(0.0001, 2.1);
  w.connect(band).connect(wg).connect(master);
  w.start(0.85);

  hits.forEach((t, i) => {
    const pitch = 0.9 + ((i * 37) % 10) / 50; // 0.9–1.08, varies per stamp
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(150 * pitch, t);
    thud.frequency.exponentialRampToValueAtTime(46 * pitch, t + 0.14);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.exponentialRampToValueAtTime(0.9, t + 0.004);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    thud.connect(tg).connect(master);
    thud.start(t);
    thud.stop(t + 0.32);

    const slap = noise(0.1);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 1600 * pitch;
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.45, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    slap.connect(low).connect(sg).connect(master);
    slap.start(t);
  });
  return ctx.startRendering();
}

/* ------------------------------------------------------------ entry */

type Scene = { canvas: HTMLCanvasElement; frame: (t: number) => void; hits: number[] };

// Everything drawn once (pages, inked stamps), and frame(t) that composes the picture at time t.
async function buildScene(root: HTMLElement, data: PassportData): Promise<Scene> {
  await document.fonts.ready;
  const [paper, ink, photo, css] = await Promise.all([
    loadImage("/passport/paper.jpg"),
    loadImage("/passport/ink.webp"),
    loadImage(`/_next/image?url=${encodeURIComponent(thumbImage(data.photo))}&w=640&q=75`),
    fontFace(),
  ]);

  // Stamps, from the passport on the page: the stamps page, then the "Fock it." on the photo.
  const page = root.querySelector<HTMLElement>(".pp-right") ?? root.querySelector<HTMLElement>(".pp-mobile-stamps");
  const onPage = [...(page?.querySelectorAll<HTMLElement>(".pp-stamp") ?? [])];
  const stamps: Stamp[] = [];
  for (const [i, el] of onPage.entries()) {
    const svg = el.querySelector("svg");
    if (!svg) continue;
    const w = (parseFloat(el.style.width) / 100) * PAGE_W;
    const worn = el.classList.contains("pp-ink");
    const img = await inkStamp(svg, getComputedStyle(el).color, Math.round(w * 2), css, ink, [(i * 37) % 240, (i * 61) % 240], worn);
    stamps.push({ img, x: (parseFloat(el.style.left) / 100) * PAGE_W, y: (parseFloat(el.style.top) / 100) * PAGE_H, w, h: (w * img.height) / img.width, r: parseFloat(el.style.getPropertyValue("--r")) || 0, multiply: worn });
  }
  const fockSvg = root.querySelector<SVGSVGElement>(".pp-back .pp-stamp svg") ?? onPage[0]?.querySelector("svg");
  const fockW = 38 * CQ;
  const fock = fockSvg ? await inkStamp(fockSvg, "#d11a2e", Math.round(fockW * 2), css, ink, [24, 140], true) : null;
  const coverStamp = fockSvg ? await inkStamp(fockSvg, C.cream, Math.round(26 * CQ), css, ink, [96, 24], true) : canvas(1, 1);

  const cover = coverLayer(paper, coverStamp);
  const identity = await identityLayer(data, paper, photo);
  const stampsBase = stampsLayer(paper);
  const photoStamp: Stamp | null = fock
    ? { img: fock, x: PAGE_W - 7 * CQ - fockW + 2 * CQ, y: identity.photoBottom - 3 * CQ - (fockW * fock.height) / fock.width, w: fockW, h: (fockW * fock.height) / fock.width, r: -12, multiply: true }
    : null;

  const out = canvas(SIZE, SIZE);
  const ctx = out.getContext("2d")!;

  const frame = (t: number) => {
    // background + titles
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 100, SIZE / 2, SIZE / 2, SIZE * 0.75);
    g.addColorStop(0, "#f3ede3");
    g.addColorStop(1, C.bg);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
    text(ctx, "LADS PASSPORT", SIZE / 2, 82, 22, { weight: 700, color: C.accent, spacing: 0.32, align: "center" });
    text(ctx, "madlads.com · Fock it.", SIZE / 2, SIZE - 58, 22, { weight: 600, color: C.muted, align: "center" });

    // opening: 0 = closed, 1 = open
    const open = ease(clamp((t - 0.9) / 1.2));
    const float = (1 - open) * Math.sin(t * 2.4) * 6;
    const spine = SPREAD_X + PAGE_W - PAGE_W / 2 + (PAGE_W / 2) * open; // closed: cover centred; open: spread centred
    const top = SPREAD_Y + float;

    // book shadow
    ctx.save();
    ctx.shadowColor = "rgba(40,4,8,0.35)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.fillStyle = C.paper;
    // only under what is visible: the right page, plus the cover once it has crossed the spine
    const angle = open * Math.PI;
    const span = Math.abs(Math.cos(angle)) * PAGE_W;
    const shadowLeft = angle > Math.PI / 2 ? spine - span : spine;
    ctx.beginPath();
    ctx.roundRect(shadowLeft + 8, top + 8, spine + PAGE_W - shadowLeft - 16, PAGE_H - 16, 16);
    ctx.fill();
    ctx.restore();

    // right page (stamps), under the cover
    roundedPage(ctx, stampsBase, spine, top, PAGE_W, false);
    stamps.forEach((s, i) => drawStamp(ctx, s, spine, top, (t - stampStart(i)) / STAMP.land));

    // the cover turning on the spine: front face first, then the identity page (its back)
    if (angle < Math.PI / 2) {
      roundedPage(ctx, cover, spine, top, span, false);
      ctx.fillStyle = `rgba(0,0,0,${Math.sin(angle) * 0.35})`;
      ctx.fillRect(spine, top, span, PAGE_H);
    } else {
      roundedPage(ctx, identity.canvas, spine - span, top, span, true);
      ctx.fillStyle = `rgba(0,0,0,${Math.sin(angle) * 0.25})`;
      ctx.fillRect(spine - span, top, span, PAGE_H);
      if (photoStamp) drawStamp(ctx, { ...photoStamp, x: photoStamp.x * (span / PAGE_W), w: photoStamp.w * (span / PAGE_W) }, spine - span, top, (t - stampStart(stamps.length) - 0.1) / STAMP.land);
    }

    // fold shadow along the spine once open
    if (open > 0.5) {
      const fold = ctx.createLinearGradient(spine - 40, 0, spine + 40, 0);
      fold.addColorStop(0, "rgba(60,40,20,0)");
      fold.addColorStop(0.5, `rgba(60,40,20,${0.18 * (open - 0.5) * 2})`);
      fold.addColorStop(1, "rgba(60,40,20,0)");
      ctx.fillStyle = fold;
      ctx.fillRect(spine - 40, top, 80, PAGE_H);
    }
  };

  // when each stamp hits the paper, for the sound
  const hits = [...stamps.map((_, i) => stampStart(i)), ...(photoStamp ? [stampStart(stamps.length) + 0.1] : [])].map((t) => t + STAMP.land * STAMP.hit);
  return { canvas: out, frame, hits };
}

/* ------------------------------------------------------------ outputs */

// The final frame (open passport, every stamp) as a PNG.
export async function passportImage(scene: Scene): Promise<Blob> {
  scene.frame(DURATION);
  return new Promise((resolve, reject) => scene.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No image"))), "image/png"));
}

// The whole reveal as an MP4 (H.264, plus AAC sound where the browser can encode it).
export async function passportVideo(scene: Scene, onProgress?: (p: number) => void): Promise<Blob> {
  const { AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, QUALITY_MEDIUM, canEncodeAudio, canEncodeVideo } = await import("mediabunny");
  if (!(await canEncodeVideo("avc", { width: SIZE, height: SIZE }))) throw new Error("This browser can't make MP4 videos.");
  const out = scene.canvas;
  const frame = scene.frame;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(out, { codec: "avc", bitrate: QUALITY_HIGH, keyFrameInterval: 2 });
  output.addVideoTrack(source, { frameRate: FPS });
  // sound only where the browser can encode AAC (the audio codec X and phones expect); otherwise a silent video
  const withSound = await canEncodeAudio("aac", { numberOfChannels: 2, sampleRate: 48000 });
  const audio = withSound ? new AudioBufferSource({ codec: "aac", bitrate: QUALITY_MEDIUM }) : null;
  if (audio) output.addAudioTrack(audio);
  await output.start();
  if (audio) {
    await audio.add(await soundtrack(scene.hits));
    audio.close();
  }
  const frames = Math.round(DURATION * FPS);
  for (let i = 0; i < frames; i++) {
    frame(i / FPS);
    await source.add(i / FPS, 1 / FPS);
    onProgress?.((i + 1) / frames);
  }
  await output.finalize();
  return new Blob([output.target.buffer!], { type: "video/mp4" });
}

// Both, from one scene: the image first (instant), then the video.
export async function makePassportMedia(root: HTMLElement, data: PassportData, onImage: (b: Blob) => void, onProgress?: (p: number) => void) {
  const scene = await buildScene(root, data);
  onImage(await passportImage(scene));
  return passportVideo(scene, onProgress);
}
