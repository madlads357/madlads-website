"use client";

import Image from "next/image";
import { useCallback, useState, type CSSProperties } from "react";
import { irlPhotos } from "@/data/irl";
import { links } from "@/data/site";
import { Button } from "../Button";
import { BeyondHeader } from "./Shared";
import { Lightbox } from "./Lightbox";

// Pinned horizontal reel: the section sticks while you scroll down and the photos glide
// sideways (pure CSS, see `.reel*` in globals.css). Polish:
// - editorial rhythm: three frame heights, every other frame set lower
// - depth parallax: each photo drifts slightly inside its frame as the reel moves
// - progress bar + numbered captions, soft faded edges, closing "your city next?" card
// - click a photo → full-screen lightbox (← → to browse)
// Phones / unsupported browsers: a swipeable row with snap.
// Frame heights derive from the space left under the nav + title (--reel-h, set on the track),
// so the pinned reel always fits the screen.
const HEIGHTS = ["md:h-[var(--reel-h)]", "md:h-[calc(var(--reel-h)*0.78)]", "md:h-[calc(var(--reel-h)*0.88)]"];
const OFFSET = "md:mt-[calc(var(--reel-h)*0.14)]";

export function ReelGallery() {
  const [open, setOpen] = useState<number | null>(null);
  const total = irlPhotos.length;
  const close = useCallback(() => setOpen(null), []);
  const prev = open !== null && open > 0 ? () => setOpen(open - 1) : undefined;
  const next = open !== null && open < total - 1 ? () => setOpen(open + 1) : undefined;

  return (
    <div className="reel">
      <div className="reel-viewport">
        <BeyondHeader row className="pt-20 pb-10 md:pt-4 md:pb-6" />

        <div className="reel-mask">
          <ul className="reel-track flex w-max items-start gap-4 px-4 pb-6 md:gap-8 md:px-page md:pb-4" style={{ "--reel-h": "clamp(260px, calc(100svh - 430px), 540px)" } as CSSProperties}>
            {irlPhotos.map((p, i) => (
              <li key={p.src} className={`shrink-0 ${i % 2 ? OFFSET : ""}`}>
                <figure className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`View larger: ${p.caption}`}
                    className={`group relative block h-[340px] cursor-zoom-in overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 transition-transform duration-500 ease-out hover:-translate-y-1.5 ${HEIGHTS[i % 3]}`}
                    style={{ aspectRatio: `${p.w} / ${p.h}` } as CSSProperties}
                  >
                    <span className="reel-parallax absolute inset-0 block">
                      <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 45vh, 70vw" className="object-cover transition-[filter] duration-500 group-hover:brightness-110" />
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </button>
                  <figcaption className="flex max-w-[340px] items-baseline gap-3">
                    <span className="text-xs text-white/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex flex-col gap-1">
                      <span className="t-eyebrow text-red">{p.where}</span>
                      <span className="font-semibold text-white/90">{p.caption}</span>
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}

            {/* Closing card */}
            <li className={`shrink-0 ${OFFSET}`}>
              <div className="flex h-[340px] w-[min(400px,78vw)] flex-col justify-end gap-5 rounded-xl bg-white/[0.04] p-7 ring-1 ring-white/15 md:h-auto md:min-h-[calc(var(--reel-h)*0.78)] md:p-9">
                <p className="t-eyebrow text-white/60">Your turn</p>
                <p className="text-[clamp(2rem,3.2vw,3rem)] leading-[1] font-bold tracking-[-0.03em]">
                  Your city <span className="text-red">next?</span>
                </p>
                <p className="text-white/70">Meetups are thrown by holders all over the world. Find your crew on Discord.</p>
                <div>
                  <Button href={links.discord} variant="inverse" external>
                    Join the Discord ↗
                  </Button>
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Progress (desktop reel) / swipe hint (phones) */}
        <div className="flex items-center gap-4 px-4 pb-16 md:px-page md:pb-5">
          <span className="reel-progress-track relative hidden h-px flex-1 overflow-hidden bg-white/15 md:block">
            <span className="reel-progress absolute inset-0 bg-red" />
          </span>
          <span className="t-eyebrow text-white/60 md:hidden">Swipe →</span>
          <span className="t-eyebrow hidden text-white/60 md:inline">{total} moments IRL</span>
        </div>
      </div>

      {open !== null && <Lightbox photo={irlPhotos[open]} index={open} total={total} onClose={close} onPrev={prev} onNext={next} />}
    </div>
  );
}
