"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { IrlPhoto } from "@/data/irl";
import { CloseIcon } from "../Icons";

// Full-screen view of one photo. Esc / click outside to close; page scroll pauses meanwhile.
export function Lightbox({ photo, index, total, onClose, onPrev, onNext }: { photo: IrlPhoto; index: number; total: number; onClose: () => void; onPrev?: () => void; onNext?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    window.__lenis?.stop();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={photo.caption} data-lenis-prevent>
      <button type="button" className="absolute inset-0 bg-black/90 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <figure key={photo.src} className="relative flex animate-[pop_220ms_ease-out] flex-col items-center gap-4">
        <div className="relative" style={{ aspectRatio: `${photo.w} / ${photo.h}`, height: "min(76svh, 900px)", maxWidth: "92vw" }}>
          <Image src={photo.src} alt={photo.alt} fill sizes="90vw" className="rounded-xl object-contain" />
        </div>
        <figcaption className="flex items-center gap-4 text-white">
          <span className="text-sm text-white/60 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span>
            <span className="t-eyebrow text-red">{photo.where}</span>
            <span className="ml-3 font-semibold">{photo.caption}</span>
          </span>
        </figcaption>
      </figure>
      <div className="pointer-events-none absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between md:inset-x-8">
        <NavButton label="Previous photo" onClick={onPrev} flip />
        <NavButton label="Next photo" onClick={onNext} />
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 md:top-6 md:right-6">
        <CloseIcon className="size-5" />
      </button>
    </div>
  );
}

function NavButton({ label, onClick, flip }: { label: string; onClick?: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      className="pointer-events-auto grid size-12 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-all hover:bg-white/20 disabled:opacity-0"
    >
      <svg viewBox="0 0 24 24" className={`size-5 ${flip ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}
