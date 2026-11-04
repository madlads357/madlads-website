"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/Icons";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { memes, type Meme } from "@/data/memes";

// The meme vault (from the backpack): every community meme on a wall, newest batch first loaded as
// you scroll. Click one to see it large with its author's credit; ← → or swipe to browse, Random to
// land anywhere, Download or Copy to take it with you. Images: public/memes, list: data/memes.ts.
const BATCH = 48;
const src = (m: Meme) => `/memes/${m.file}.webp`;
const authors = new Set(memes.map((m) => m.author)).size;

export function MemeVault({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(BATCH);
  const [open, setOpen] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  useDialogFocus(root);

  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + memes.length) % memes.length)), []);
  const random = () => setOpen(Math.floor(Math.random() * memes.length));

  // Esc closes the meme first, then the vault; arrows browse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return open !== null ? setOpen(null) : onClose();
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
  }, [open, onClose, step]);

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
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col bg-[#1a0508]/95 text-white backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Meme vault">
      <header className="flex items-center justify-between gap-4 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 md:px-6">
        <div className="min-w-0">
          <p className="t-eyebrow text-white/60">Meme vault</p>
          <p className="truncate text-sm text-white/80">
            {memes.length} memes by {authors} Lads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={random} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-red hover:text-white">
            Random
          </button>
          <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 transition-colors hover:bg-white/20">
            <CloseIcon className="size-5" />
          </button>
        </div>
      </header>

      <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-10 md:px-6" data-lenis-prevent>
        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5 [&>li]:mb-3">
          {memes.slice(0, shown).map((m, i) => (
            <li key={m.file} className="break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative block w-full overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10 transition hover:ring-white/50"
                aria-label={`Meme by @${m.author}`}
              >
                <Image
                  src={src(m)}
                  alt=""
                  width={m.w}
                  height={m.h}
                  unoptimized={m.animated}
                  sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 48vw"
                  className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  @{m.author}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {shown < memes.length && <div ref={sentinel} className="h-10" />}
      </div>

      {open !== null && <Viewer meme={memes[open]} index={open} onClose={() => setOpen(null)} onStep={step} say={say} />}
      {note && (
        <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-xl" role="status">
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

  const nav = "grid size-11 place-items-center rounded-full bg-white/10 text-xl ring-1 ring-white/20 transition-colors hover:bg-white/20";
  const pill = "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors";
  return (
    <div className="absolute inset-0 z-[5] flex flex-col bg-black/90" role="dialog" aria-label={`Meme by @${meme.author}`}>
      <button type="button" className="absolute inset-0 cursor-zoom-out" aria-label="Back to the memes" onClick={onClose} />
      <div className="relative flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 md:px-6">
        <p className="text-sm text-white/60 tabular-nums">
          {index + 1} / {memes.length}
        </p>
        <button type="button" onClick={onClose} aria-label="Back to the memes" className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 transition-colors hover:bg-white/20">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div
        className="pointer-events-none relative flex min-h-0 flex-1 touch-pan-y items-center justify-center gap-4 px-4"
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
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous meme" className={`${nav} pointer-events-auto max-md:hidden`}>
          ←
        </button>
        {/* key: a fresh image per meme, no flash of the previous one */}
        <Image
          key={meme.file}
          src={src(meme)}
          alt={`Meme by @${meme.author}`}
          width={meme.w}
          height={meme.h}
          unoptimized={meme.animated}
          sizes="90vw"
          priority
          className="pointer-events-auto h-auto max-h-full w-auto max-w-full animate-[pop_200ms_ease-out] rounded-lg object-contain shadow-2xl"
        />
        <button type="button" onClick={() => onStep(1)} aria-label="Next meme" className={`${nav} pointer-events-auto max-md:hidden`}>
          →
        </button>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-2 px-4 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <a href={meme.link} target="_blank" rel="noopener noreferrer" className={`${pill} bg-white/10 ring-1 ring-white/25 hover:bg-white/20`}>
          by @{meme.author} ↗
        </a>
        <button type="button" onClick={copy} className={`${pill} bg-white/10 ring-1 ring-white/25 hover:bg-white/20`}>
          Copy
        </button>
        <button type="button" onClick={download} className={`${pill} bg-white text-ink hover:bg-red hover:text-white`}>
          Download
        </button>
      </div>
    </div>
  );
}
