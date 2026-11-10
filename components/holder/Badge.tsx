"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CloseIcon } from "@/components/Icons";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { thumbImage } from "@/lib/madlads";
import { MAX_ID, backgroundOf, css, drawLogo, loadLad } from "./Wallpapers";
import "./meme-vault.css";

// The meetup badge (from the backpack): a printable "HELLO my name is" name tag with your LAD, your name,
// "MAD for N days" and, if you want it, a QR code to your passport. Drawn in the browser at 4 × 3 inch, 300 dpi.
// The QR code is the only thing that goes anywhere: it asks for the public passport link (the same as the
// passport's Share button), so it is off until the holder turns it on. Styles: meme-vault.css.
const W = 1200;
const H = 900; // 4 × 3 inch at 300 dpi
const RED = "#f62038";
const INK = "#111111";
const PAPER = "#f6f1e8";
const NAME_MAX = 24;

const daysSince = (iso?: string) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86_400_000)) : null;
};
const defaultLine = (since?: string) => {
  const d = daysSince(since);
  return d === null ? "MAD LADS holder" : `MAD for ${d.toLocaleString("en-US")} ${d === 1 ? "day" : "days"}`;
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function render(canvas: HTMLCanvasElement, opts: { photo: number; name: string; line: string; qr: string | null; font: string }) {
  const { photo, name, line, qr, font } = opts;
  const img = await loadLad(photo, 1080); // shown in a 330 px square: no need for the full-size picture
  const bg = backgroundOf(img);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const f = (weight: number, size: number, italic = false) => `${italic ? "italic " : ""}${weight} ${size}px ${font}`;

  // paper, a red band, a thin ink frame
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = RED;
  ctx.fillRect(0, 0, W, 250);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 250, W, 10);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // HELLO / my name is, centred on the red band
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.font = f(900, 150);
  ctx.fillText("HELLO", W / 2, 160);
  ctx.font = f(600, 50, true);
  ctx.fillText("my name is", W / 2, 224);
  ctx.textAlign = "left";

  // the LAD in a frame, on its own background color
  const S = 330;
  const px = 70;
  const py = 322;
  ctx.save();
  roundRect(ctx, px, py, S, S, 22);
  ctx.clip();
  ctx.fillStyle = css(bg);
  ctx.fillRect(px, py, S, S);
  // a square of the art with the head high in it: the art has a lot of room above the head, so start lower and come in a little
  const side = img.naturalWidth * 0.84;
  ctx.drawImage(img, (img.naturalWidth - side) / 2, img.naturalHeight * 0.115, side, side, px, py, S, S);
  ctx.restore();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;
  roundRect(ctx, px, py, S, S, 22);
  ctx.stroke();

  // the name: as big as fits next to the LAD
  const nx = px + S + 60;
  const nw = W - 70 - nx;
  let size = 150;
  const text = name.trim() || "MAD LAD";
  ctx.font = f(900, size);
  while (size > 54 && ctx.measureText(text).width > nw) ctx.font = f(900, (size -= 4));
  ctx.fillStyle = INK;
  ctx.textBaseline = "middle";
  ctx.fillText(text, nx, py + 90, nw);

  // "MAD for N days" on a red label
  const sub = line.trim();
  if (sub) {
    let ss = 58;
    ctx.font = f(800, ss);
    while (ss > 30 && ctx.measureText(sub).width > nw - 60) ctx.font = f(800, (ss -= 2));
    const bw = ctx.measureText(sub).width + 60;
    ctx.fillStyle = RED;
    roundRect(ctx, nx, py + 190, bw, 96, 48);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(sub, nx + 30, py + 190 + 50);
  }

  // the bottom row: the logo, and the QR code to the passport (or a plain line)
  const bottom = 700;
  drawLogo(ctx, 70, bottom + 10, 150, INK);
  ctx.fillStyle = INK;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  if (qr) {
    const QRCode = (await import("qrcode")).default; // only when a QR code is asked for
    const code = QRCode.create(qr, { errorCorrectionLevel: "M" });
    const n = code.modules.size;
    const box = 190;
    const bx = W - 70 - box;
    const by = bottom - 24;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, bx - 14, by - 14, box + 28, box + 28, 16);
    ctx.fill();
    ctx.fillStyle = INK;
    const cell = box / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (code.modules.get(r, c)) ctx.fillRect(bx + c * cell, by + r * cell, Math.ceil(cell), Math.ceil(cell));
    ctx.font = f(800, 44);
    ctx.fillText("Scan: my passport", bx - 40, bottom + 90);
  } else {
    ctx.font = f(800, 44);
    ctx.fillText("Fock it.", W - 70, bottom + 100);
  }
}

export function Badge({ lads, photo, name, since, onClose }: { lads: number[]; photo: number; name: string; since?: string; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [picked, setPicked] = useState(photo);
  const [who, setWho] = useState(name.slice(0, NAME_MAX));
  const [line, setLine] = useState(defaultLine(since));
  const [withQr, setWithQr] = useState(false);
  const [qr, setQr] = useState<string | null>(null); // the passport link, once asked for
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

  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((n) => (n === text ? null : n)), 4000);
  };

  // The link behind the QR code: asked for when the holder turns it on (and again for another photo).
  useEffect(() => {
    if (!withQr) return;
    let live = true;
    fetch("/api/passport/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photo: picked }) })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { url: string; removable: boolean }) => {
        if (!live) return;
        if (!d.removable) {
          setWithQr(false);
          say("The QR code needs the passport links, which aren’t available here.");
        } else setQr(d.url);
      })
      .catch(() => {
        if (!live) return;
        setWithQr(false);
        say("Couldn’t make the passport link. Try again.");
      });
    return () => {
      live = false;
    };
  }, [withQr, picked]);

  const qrText = withQr ? qr : null;
  const key = `${picked}|${who}|${line}|${qrText}`;
  const drawn = useRef("");
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    let live = true;
    setBusy(true);
    const font = getComputedStyle(document.body).fontFamily || "sans-serif";
    const off = document.createElement("canvas");
    Promise.all([document.fonts.load(`900 100px ${font}`), document.fonts.load(`800 100px ${font}`)])
      .catch(() => {})
      .then(() => render(off, { photo: picked, name: who, line, qr: qrText, font }))
      .then(() => {
        if (!live) return;
        c.width = W;
        c.height = H;
        c.getContext("2d")!.drawImage(off, 0, 0);
        drawn.current = key;
      })
      .catch(() => live && say("Couldn’t load that LAD. Try again."))
      .finally(() => live && setBusy(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` sums up everything drawn
  }, [key]);

  const pick = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(query);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ID) {
      setPicked(n);
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
      a.download = `mad-lads-badge-${picked}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  };

  const choices = [...new Set([...lads, picked])];
  const field = "min-w-0 rounded-[4px] bg-surface px-4 py-3 text-base ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-ink md:text-sm";

  return (
    <div ref={root} className="mv-room fixed inset-0 z-[80] flex flex-col text-ink" role="dialog" aria-modal="true" aria-label="Meetup badge" data-lenis-prevent>
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2 md:px-page md:pt-6">
        <div className="min-w-0">
          <p className="t-eyebrow text-accent">Meetup badge</p>
          <h2 className="mt-1 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
            Hello, I’m a <span className="text-red">LAD</span>.
          </h2>
        </div>
        <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
          <CloseIcon className="size-5" />
        </button>
      </header>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-6 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)] md:gap-x-12 md:px-page">
        {/* The preview: the real picture, scaled down */}
        <div className="flex min-h-0 shrink-0 items-start justify-center md:items-center">
          <div className="relative aspect-[4/3] w-full max-w-[760px] overflow-hidden rounded-[6px] bg-sunken shadow-[0_26px_50px_-24px_rgba(60,20,10,0.45)]">
            <canvas ref={canvas} className={`size-full transition-opacity duration-300 ${busy ? "opacity-60" : ""}`} aria-label="Badge preview" role="img" />
            {busy && <span className="absolute inset-0 m-auto size-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" aria-hidden />}
          </div>
        </div>

        <div className="thin-scroll flex min-h-0 flex-col gap-5 md:gap-6 md:overflow-y-auto md:pr-2">
          <section className="flex flex-col gap-3">
            <h3 className="t-eyebrow text-muted">Your name</h3>
            <label className="sr-only" htmlFor="badge-name">
              Name on the badge
            </label>
            <input id="badge-name" value={who} maxLength={NAME_MAX} onChange={(e) => setWho(e.target.value)} placeholder="Your name" className={field} />
            <label className="sr-only" htmlFor="badge-line">
              Line under the name
            </label>
            <input id="badge-line" value={line} maxLength={28} onChange={(e) => setLine(e.target.value)} placeholder="Under your name" className={field} />
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="t-eyebrow text-muted">Your LAD</h3>
            <div className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
              {choices.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPicked(id)}
                  aria-pressed={picked === id}
                  aria-label={`MAD LADS #${id}`}
                  className={`relative size-14 shrink-0 snap-start overflow-hidden rounded-lg bg-sunken ring-2 transition ${picked === id ? "-translate-y-0.5 shadow-md ring-red" : "ring-transparent hover:-translate-y-0.5"}`}
                >
                  <Image src={thumbImage(id)} alt="" fill sizes="56px" quality={70} className="object-cover" />
                </button>
              ))}
            </div>
            <form onSubmit={pick} className="flex gap-2">
              <label className="sr-only" htmlFor="badge-lad">
                Any MAD LADS by number
              </label>
              <input
                id="badge-lad"
                inputMode="numeric"
                enterKeyHint="go"
                value={query}
                onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Any LAD, e.g. 5894"
                className={`flex-1 ${field}`}
              />
              <button type="submit" className="rounded-[4px] border-[1.5px] border-ink px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-white">
                Use
              </button>
            </form>
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="t-eyebrow text-muted">QR code</h3>
            <div className="flex w-fit rounded-full bg-ink/[0.06] p-1 text-sm font-semibold" role="group" aria-label="QR code to your passport">
              {([false, true] as const).map((on) => (
                <button
                  key={String(on)}
                  type="button"
                  aria-pressed={withQr === on}
                  onClick={() => setWithQr(on)}
                  className={`rounded-full px-4 py-2 whitespace-nowrap transition ${withQr === on ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}
                >
                  {on ? "My passport" : "None"}
                </button>
              ))}
            </div>
          </section>

          {/* Phones: Download stays at the bottom of the screen while the choices scroll */}
          <div className="flex flex-col gap-2 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-4 max-md:border-t max-md:border-line max-md:bg-[#f6f1e8] max-md:px-4 max-md:pt-3 max-md:pb-[max(12px,env(safe-area-inset-bottom))] md:flex-row md:flex-wrap md:items-center md:gap-3 md:border-t md:border-line md:pt-4">
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="w-full rounded-[4px] bg-accent px-5 py-4 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink disabled:opacity-50 md:w-auto md:py-3.5"
            >
              {busy ? "Making it…" : "Download badge"}
            </button>
            <p className="text-xs text-muted tabular-nums max-md:hidden">
              {W} × {H} px · 4 × 3 in at 300 dpi
            </p>
            {note && (
              <p className="text-xs text-muted" role="status" aria-live="polite">
                {note}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
