"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseIcon } from "@/components/Icons";
import { STACKED } from "@/components/Logo";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { originalImage, thumbImage } from "@/lib/madlads";
import "./meme-vault.css";

// Wallpapers (from the backpack), like the DeGods gallery's: a phone wallpaper, a desktop wallpaper and an
// X banner made from your LADS, in the same paper world as the meme vault. The picture is filled with the
// LAD's own background color (read from the art) and its edges fade into it, so there's no seam; the MAD
// LADS logo sits where the phone clock and the X profile picture don't cover it. Drawn in the browser at
// full size, nothing is sent anywhere. Styles: meme-vault.css.
const MAX_ID = 9971;
const BANNER_MAX = 3; // LADS side by side on the X banner

type Format = "phone" | "watch" | "desktop" | "banner";
const FORMATS: Record<Format, { label: string; name: string; w: number; h: number; file: string }> = {
  phone: { label: "Phone", name: "phone wallpaper", w: 1179, h: 2556, file: "phone" },
  watch: { label: "Watch", name: "watch face", w: 416, h: 496, file: "watch" }, // Apple Watch 46 mm, Photos face (smaller watches crop it a little)
  desktop: { label: "Desktop", name: "desktop wallpaper", w: 3840, h: 2160, file: "desktop" },
  banner: { label: "X banner", name: "X banner", w: 1500, h: 500, file: "x-banner" },
};

type Rgb = [number, number, number];
const css = ([r, g, b]: Rgb, a = 1) => `rgba(${r},${g},${b},${a})`;

// The logo: the official stacked MAD LADS logo (brand/media-kit/SVG/Default_Logo.svg), in black, white or red.
type LogoColor = "black" | "white" | "red" | "off";
const LOGO_COLORS: Record<Exclude<LogoColor, "off">, string> = { black: "#111111", white: "#ffffff", red: "#f62038" };
const readable = ([r, g, b]: Rgb): LogoColor => (0.299 * r + 0.587 * g + 0.114 * b > 150 ? "black" : "white"); // the one that reads on this LAD

// Full-size LADS through our image server (same origin, so the canvas can read them), loaded once.
const cache = new Map<number, Promise<HTMLImageElement>>();
const loadLad = (id: number) => {
  if (!cache.has(id)) {
    const p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`LAD #${id}`));
      img.src = `/_next/image?url=${encodeURIComponent(originalImage(id))}&w=2048&q=75`;
    });
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id)!;
};

// The art's background color: the average of its top edge, the part that meets the plain fill.
function backgroundOf(img: HTMLImageElement): Rgb {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 4;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight * 0.05, 0, 0, 64, 4);
  const d = ctx.getImageData(0, 0, 64, 4).data;
  const s: Rgb = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) s[k] += d[i + k];
  return s.map((v) => Math.round(v / (d.length / 4))) as Rgb;
}

// A LAD drawn at (x, y, w, h), its left, right and top edges fading into `bg`, so the art's light paper
// texture melts into the plain fill instead of stopping at a line. Only the background fades: each pixel
// near an edge moves toward `bg` as much as it already looks like it, so arms, hair or smoke that reach
// the edge of the art stay as they are.
const ease = (t: number) => t * t * (3 - 2 * t); // smooth 0 → 1
function drawLad(ctx: CanvasRenderingContext2D, img: HTMLImageElement, bg: Rgb, x: number, y: number, w: number, h: number, fade = { left: true, right: true, top: true }) {
  const W = Math.round(w), H = Math.round(h);
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const o = off.getContext("2d", { willReadFrequently: true })!;
  const cut = img.naturalWidth * 0.012; // a sliver off the art’s left, right and top edges, where some have a thin border
  o.drawImage(img, cut, cut, img.naturalWidth - 2 * cut, img.naturalHeight - cut, 0, 0, W, H);
  const side = W * 0.2;
  const top = H * 0.32; // the top of the art is background: it can fade for longer
  const px = o.getImageData(0, 0, W, H);
  const d = px.data;
  for (let j = 0; j < H; j++) {
    const ft = fade.top && j < top ? 1 - ease(j / top) : 0;
    for (let i = 0; i < W; i++) {
      const fl = fade.left && i < side ? 1 - ease(i / side) : 0;
      const fr = fade.right && i > W - side ? 1 - ease((W - i) / side) : 0;
      const f = Math.max(ft, fl, fr);
      if (f === 0) continue;
      const k = (j * W + i) * 4;
      const dist = Math.hypot(d[k] - bg[0], d[k + 1] - bg[1], d[k + 2] - bg[2]);
      const like = dist < 34 ? 1 : dist > 80 ? 0 : 1 - (dist - 34) / 46; // how much this pixel is background
      const a = f * like;
      if (a === 0) continue;
      for (let c = 0; c < 3; c++) d[k + c] += (bg[c] - d[k + c]) * a;
    }
  }
  o.putImageData(px, 0, 0);
  ctx.drawImage(off, x, y, w, h);
}

const LOGO_RATIO = 176 / 191; // the stacked logo's viewBox is 176×191
function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(h / 191, h / 191);
  ctx.fillStyle = color;
  for (const d of STACKED) ctx.fill(new Path2D(d));
  ctx.restore();
}

async function render(canvas: HTMLCanvasElement, format: Format, ids: number[], choice: LogoColor | "auto") {
  const { w: W, h: H } = FORMATS[format];
  const imgs = await Promise.all(ids.map(loadLad));
  const bgs = imgs.map(backgroundOf);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = css(bgs[0]);
  ctx.fillRect(0, 0, W, H);
  const logo = choice === "auto" ? readable(bgs[0]) : choice;
  const color = logo === "off" ? null : LOGO_COLORS[logo];

  if (format === "phone") {
    // The LAD at full width, standing on the bottom; the logo under the clock and the widgets.
    const h = W * 1.25;
    drawLad(ctx, imgs[0], bgs[0], 0, H - h, W, h, { left: false, right: false, top: true });
    const lh = W * 0.42; // under the clock and the widgets
    if (color) drawLogo(ctx, (W - lh * LOGO_RATIO) / 2, H * 0.24, lh, color);
  } else if (format === "watch") {
    // A small screen: the LAD fills it, a bit closer, its face in the middle; a small logo top left (the time
    // sits top right on the Photos face).
    const w = W * 1.12;
    const h = w * 1.25;
    drawLad(ctx, imgs[0], bgs[0], (W - w) / 2, H - h + H * 0.08, w, h, { left: false, right: false, top: false });
    const lh = H * 0.2;
    if (color) drawLogo(ctx, W * 0.07, H * 0.06, lh, color);
  } else if (format === "desktop") {
    // The LAD in the middle, standing on the bottom; the logo top right, away from the desktop icons.
    const h = H * 0.8;
    const w = h * 0.8;
    drawLad(ctx, imgs[0], bgs[0], (W - w) / 2, H - h, w, h);
    const lh = H * 0.2;
    if (color) drawLogo(ctx, W - W * 0.035 - lh * LOGO_RATIO, W * 0.035, lh, color);
  } else {
    // Up to three LADS on the right, each on its own color; the left stays free for the X profile picture,
    // with the logo above it.
    const w = H * 0.8;
    imgs.forEach((img, i) => {
      const x = W - (imgs.length - i) * w;
      if (i > 0) {
        ctx.fillStyle = css(bgs[i]);
        ctx.fillRect(x, 0, w, H);
      }
      drawLad(ctx, img, bgs[i], x, 0, w, H, { left: i === 0, right: false, top: false });
    });
    const lh = H * 0.6; // ends above the profile picture
    if (color) drawLogo(ctx, H * 0.12, H * 0.1, lh, color);
  }
}

export function Wallpapers({ lads, photo, onClose }: { lads: number[]; photo: number; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>("phone");
  const [picked, setPicked] = useState<number[]>([photo]); // first = the main LAD (and the color)
  const [logo, setLogo] = useState<LogoColor | "auto">("auto"); // auto: black or white, whichever reads on the LAD
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  useDialogFocus(root);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const ids = format === "banner" ? picked.slice(0, BANNER_MAX) : picked.slice(0, 1);
  const key = `${format}:${ids.join(",")}:${logo}`;

  // Redraw the preview (the real, full-size picture) whenever something changes; the last change wins.
  const drawn = useRef("");
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let live = true;
    setBusy(true);
    const off = document.createElement("canvas");
    render(off, format, ids, logo)
      .then(() => {
        if (!live) return;
        c.width = off.width;
        c.height = off.height;
        c.getContext("2d")!.drawImage(off, 0, 0);
        drawn.current = key;
      })
      .catch(() => live && say("Couldn’t load that LAD. Try again."))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` sums up format, ids and logo
  }, [key]);

  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((n) => (n === text ? null : n)), 3000);
  };

  // Phone and desktop: one LAD. Banner: tap to add or remove, up to three.
  const toggle = (id: number) =>
    setPicked((list) => {
      if (format !== "banner") return [id, ...list.filter((x) => x !== id)];
      const crew = list.slice(0, BANNER_MAX);
      if (crew.includes(id)) return crew.length > 1 ? crew.filter((x) => x !== id) : crew;
      if (crew.length >= BANNER_MAX) {
        say(`Up to ${BANNER_MAX} LADS on a banner.`);
        return crew;
      }
      return [...crew, id];
    });

  const pick = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(query);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ID) {
      toggle(n);
      setQuery("");
    } else say(`MAD LADS go from #1 to #${MAX_ID}.`);
  };

  const download = () => {
    const c = canvas.current;
    if (!c || busy || drawn.current !== key) return;
    c.toBlob((b) => {
      if (!b) return say("Couldn’t make the image. Try again.");
      const url = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mad-lads-${FORMATS[format].file}-${ids.join("-")}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const choices = [...new Set([...lads, ...picked])]; // yours in their order, a typed-in LAD added at the end
  const { w, h, label } = FORMATS[format];

  return (
    <div ref={root} className="mv-room fixed inset-0 z-[80] flex flex-col text-ink" role="dialog" aria-modal="true" aria-label="Wallpapers" data-lenis-prevent>
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2 md:px-page md:pt-6">
        <div className="min-w-0">
          <p className="t-eyebrow text-accent">Wallpapers</p>
          <h2 className="mt-1 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
            Your <span className="text-red">LAD</span>, everywhere.
          </h2>
        </div>
        <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
          <CloseIcon className="size-5" />
        </button>
      </header>

      {/* Phones: one column (formats, a compact preview, then the choices) with Download pinned at the
          bottom. Desktop: the preview on the left, the formats and choices on the right. */}
      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-6 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)] md:grid-rows-[auto_minmax(0,1fr)] md:gap-x-12 md:gap-y-6 md:overflow-hidden md:px-page md:pt-3">
        <section className="flex flex-col gap-2 md:col-start-2 md:row-start-1 md:gap-3">
          <h3 className="t-eyebrow text-muted max-md:sr-only">Format</h3>
          <div className="grid grid-cols-4 rounded-full bg-ink/[0.06] p-1 text-sm font-semibold md:flex md:w-fit" role="group" aria-label="Format">
            {(Object.keys(FORMATS) as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={format === f}
                onClick={() => setFormat(f)}
                className={`rounded-full px-2 py-2 whitespace-nowrap transition md:px-4 ${format === f ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {FORMATS[f].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted tabular-nums max-md:text-center">
            {w} × {h} px{{ banner: ". The dashed circle is where your X picture sits.", watch: ". Save it to your iPhone, then pick it for a Photos face in the Watch app." }[format as string] ?? "."}
          </p>
        </section>

        {/* The preview: the real picture, scaled down, in the shape of where it goes */}
        <div className="flex min-h-0 shrink-0 items-center justify-center md:col-start-1 md:row-span-2 md:row-start-1">
          <div
            className={`relative overflow-hidden bg-sunken shadow-[0_26px_50px_-24px_rgba(60,20,10,0.45)] ${format === "phone" ? "h-[min(38svh,420px)] rounded-[24px] border-[6px] border-ink md:h-[min(calc(100svh-200px),680px)] md:rounded-[30px] md:border-[7px]" : format === "watch" ? "h-[min(30svh,300px)] rounded-[26%/22%] border-[8px] border-ink md:h-[min(40svh,400px)] md:border-[9px]" : "w-full rounded-xl ring-1 ring-ink/10"}`}
            style={{ aspectRatio: `${w} / ${h}` }}
          >
            <canvas ref={canvas} className={`size-full transition-opacity duration-300 ${busy ? "opacity-60" : ""}`} aria-label={`${label} preview`} role="img" />
            {format === "banner" && (
              // Where X puts the profile picture over the banner (preview only)
              <span className="pointer-events-none absolute bottom-0 left-[3%] aspect-square w-[16%] translate-y-1/2 rounded-full border-2 border-dashed border-white/80" aria-hidden />
            )}
            {busy && <span className="absolute inset-0 m-auto size-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" aria-hidden />}
          </div>
        </div>

        <div className="thin-scroll flex min-h-0 flex-col gap-5 md:col-start-2 md:row-start-2 md:-mr-2 md:gap-6 md:overflow-y-auto md:pr-2">
          <section className="flex flex-col gap-3">
            <h3 className="t-eyebrow text-muted">{format === "banner" ? `Your crew · up to ${BANNER_MAX}` : "Your LAD"}</h3>
            {/* Phones: one row to swipe. Desktop: wraps. */}
            <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
              {choices.map((id) => {
                const n = ids.indexOf(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    aria-pressed={n >= 0}
                    aria-label={`MAD LADS #${id}`}
                    className={`relative size-14 shrink-0 snap-start overflow-hidden rounded-lg bg-sunken ring-2 transition ${n >= 0 ? "-translate-y-0.5 shadow-md ring-red" : "ring-transparent hover:-translate-y-0.5 hover:ring-ink/30"}`}
                  >
                    <Image src={thumbImage(id)} alt="" fill sizes="56px" quality={70} className="object-cover" />
                    {format === "banner" && n >= 0 && (
                      <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-red text-[11px] font-bold text-white" aria-hidden>
                        {n + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <form onSubmit={pick} className="flex gap-2">
              <label className="sr-only" htmlFor="wallpaper-lad">
                Any MAD LADS by number
              </label>
              <input
                id="wallpaper-lad"
                inputMode="numeric"
                enterKeyHint="go"
                value={query}
                onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Any LAD, e.g. 5894"
                className="min-w-0 flex-1 rounded-[4px] bg-surface px-4 py-3 text-base ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-ink md:text-sm"
              />
              <button type="submit" className="rounded-[4px] border-[1.5px] border-ink px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-white">
                Add
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-eyebrow text-muted">Logo</h3>
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
              <div className="flex w-fit rounded-full bg-ink/[0.06] p-1 text-sm font-semibold" role="group" aria-label="Logo color">
                {(["auto", "black", "white", "red", "off"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={logo === c}
                    onClick={() => setLogo(c)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 whitespace-nowrap transition ${logo === c ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}
                  >
                    {c !== "auto" && c !== "off" && <span className="size-3 rounded-full ring-1 ring-ink/20" style={{ background: LOGO_COLORS[c] }} aria-hidden />}
                    {{ auto: "Auto", black: "Black", white: "White", red: "Red", off: "None" }[c]}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Download: always in reach. Phones: a full-width bar at the bottom. Desktop: under the choices. */}
      <div className="border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)] md:gap-x-12 md:border-0 md:px-page md:pt-0 md:pb-6">
        <div className="flex flex-col gap-2 md:col-start-2 md:flex-row md:flex-wrap md:items-center md:gap-3 md:border-t md:border-line md:pt-4">
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="w-full rounded-[4px] bg-accent px-5 py-4 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink disabled:opacity-50 md:w-auto md:py-3.5"
          >
            {busy ? "Making it…" : `Download ${FORMATS[format].name}`}
          </button>
          {note && (
            <p className="text-center text-xs text-muted md:text-left" role="status" aria-live="polite">
              {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
