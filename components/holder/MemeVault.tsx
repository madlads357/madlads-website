"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { CloseIcon } from "@/components/Icons";
import { HERO, inView, morph } from "@/components/MadLadsExplorer";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { memes, type Meme } from "@/data/memes";
import "./meme-vault.css";

// The meme vault (from the backpack), in the same paper world as the passport and the dressing room:
// every community meme pinned as a print, its author written on it like a polaroid caption, rising in
// as you scroll (48 more at a time). Click one and it grows into the large view (the explorer's morph);
// ← → or swipe to browse, Random to land anywhere, Copy or Download to take it with you.
// Images: public/memes, list: data/memes.ts. Styles: meme-vault.css.
const BATCH = 48;
const src = (m: Meme) => `/memes/${m.file}.webp`;
const authors = new Set(memes.map((m) => m.author)).size;
const TILTS = [-2.2, 1.6, -1.1, 2.4, -1.8, 1.2, -2.6, 0.9];

export function MemeVault({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(BATCH);
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  useDialogFocus(root);

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + memes.length) % memes.length)), []);
  const random = () => setOpen(Math.floor(Math.random() * memes.length));
  const openFrom = (i: number, el: HTMLElement) => morph(() => setOpen(i), el.querySelector<HTMLElement>("[data-print]"));
  // Back to the wall: the meme shrinks into its print when that one is on screen (the explorer's morph).
  const close = useCallback(() => {
    if (open === null) return;
    const file = memes[open].file;
    morph(
      () => setOpen(null),
      null,
      () => inView(document.querySelector<HTMLElement>(`[data-meme="${file}"] [data-print]`)),
    );
  }, [open]);

  // Esc closes the meme first, then the vault; arrows browse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return open !== null ? close() : onClose();
      if (open === null) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, step, close]);

  // More memes as the end of the wall comes into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((n) => Math.min(memes.length, n + BATCH)), { rootMargin: "800px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((n) => (n === text ? null : n)), 3000);
  };

  return (
    <div ref={root} className="mv-room fixed inset-0 z-[80] flex flex-col text-ink" role="dialog" aria-modal="true" aria-label="Meme vault">
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 md:px-page md:pt-6">
        <div className="min-w-0">
          <p className="t-eyebrow text-accent">Meme vault</p>
          <h2 className="mt-1 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
            {memes.length} memes by <span className="text-red">{authors} LADS</span>.
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={random} className="rounded-[4px] bg-accent px-4 py-3 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink md:px-5">
            Random
          </button>
          <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-11 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
            <CloseIcon className="size-5" />
          </button>
        </div>
      </header>

      {/* The wall: prints pinned in columns, each a little tilted */}
      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-16 md:px-page" data-lenis-prevent>
        <ul className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 [&>li]:mb-5">
          {memes.slice(0, shown).map((m, i) => (
            <li key={m.file} data-meme={m.file} className="mv-rise break-inside-avoid" style={{ "--tilt": `${TILTS[i % TILTS.length]}deg` } as CSSProperties}>
              <button type="button" onClick={(e) => openFrom(i, e.currentTarget)} className="mv-print group block w-full text-left" aria-label={`Meme by @${m.author}`}>
                <span data-print className="relative block overflow-hidden rounded-[3px] bg-sunken">
                  <Image
                    src={src(m)}
                    alt=""
                    width={m.w}
                    height={m.h}
                    unoptimized={m.animated}
                    sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                    className="h-auto w-full"
                  />
                </span>
                <span className="mv-caption mt-2 block truncate px-0.5 text-[13px] font-semibold text-muted group-hover:text-accent">@{m.author}</span>
              </button>
            </li>
          ))}
        </ul>
        {shown < memes.length && <div ref={sentinel} className="h-10" />}
        {shown >= memes.length && <p className="pt-4 text-center text-sm text-muted">That’s all {memes.length}. Fock it.</p>}
      </div>

      {open !== null && <Viewer meme={memes[open]} index={open} onClose={close} onStep={step} say={say} />}
      {note && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-xl" role="status">
          {note}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ one meme, large */

function Viewer({ meme, index, onClose, onStep, say }: { meme: Meme; index: number; onClose: () => void; onStep: (d: number) => void; say: (t: string) => void }) {
  const swipeX = useRef<number | null>(null);

  const download = () => {
    const a = document.createElement("a");
    a.href = src(meme);
    a.download = `mad-lads-meme-${meme.file}.webp`;
    a.click();
  };
  // Clipboards take PNG: redraw the meme on a canvas first (animated ones copy their first frame).
  const copy = async () => {
    try {
      const img = new window.Image();
      img.src = src(meme);
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      const png = await new Promise<Blob>((r, j) => c.toBlob((b) => (b ? r(b) : j(new Error("no image"))), "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      say("Meme copied: paste it anywhere.");
    } catch {
      say("This browser can’t copy images. Use Download instead.");
    }
  };

  const nav = "grid size-12 shrink-0 place-items-center rounded-full bg-surface text-xl ring-1 ring-line transition hover:ring-ink";
  return (
    <div className="mv-paper absolute inset-0 z-[5] flex flex-col" role="dialog" aria-label={`Meme by @${meme.author}`}>
      <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 md:px-page md:pt-6">
        <p className="t-eyebrow text-muted tabular-nums">
          Meme {index + 1} of {memes.length}
        </p>
        <button type="button" onClick={onClose} aria-label="Back to the wall" className="grid size-11 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center gap-6 px-4"
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipeX.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipeX.current === null) return;
          const dx = e.clientX - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) > 50) onStep(dx > 0 ? -1 : 1);
        }}
      >
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous meme" className={`${nav} max-md:hidden`}>
          ←
        </button>
        {/* the large print: shares its name with the clicked one, so it grows out of it */}
        <figure className="mv-large flex max-h-full min-h-0 flex-col">
          <span className="relative block min-h-0 overflow-hidden rounded-[3px]" style={{ viewTransitionName: HERO }}>
            <Image
              key={meme.file}
              src={src(meme)}
              alt={`Meme by @${meme.author}`}
              width={meme.w}
              height={meme.h}
              unoptimized={meme.animated}
              sizes="80vw"
              loading="eager"
              fetchPriority="high"
              className="block h-auto max-h-[calc(100svh-270px)] w-auto max-w-full object-contain"
            />
          </span>
          <figcaption className="mt-3 flex items-center justify-between gap-4 px-1 text-sm">
            <a href={meme.link} target="_blank" rel="noopener noreferrer" className="truncate font-semibold hover:text-accent">
              by @{meme.author} <span className="text-muted">↗</span>
            </a>
            <span className="text-muted">MAD LADS meme</span>
          </figcaption>
        </figure>
        <button type="button" onClick={() => onStep(1)} aria-label="Next meme" className={`${nav} max-md:hidden`}>
          →
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <button type="button" onClick={download} className="rounded-[4px] bg-accent px-5 py-3.5 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink">
          Download
        </button>
        <button type="button" onClick={copy} className="rounded-[4px] border-[1.5px] border-ink px-5 py-3 text-[15px] leading-none font-semibold transition-colors hover:bg-ink hover:text-white">
          Copy
        </button>
        <span className="px-2 text-xs text-muted md:hidden">Swipe to browse</span>
      </div>
    </div>
  );
}
