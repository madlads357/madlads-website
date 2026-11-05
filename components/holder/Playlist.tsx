"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/Icons";
import { Button } from "@/components/Button";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { links, spotifyEmbed } from "@/data/site";
import "./meme-vault.css";

// The playlist (from the backpack), in the same paper world as the meme vault: the cassette as a print,
// and Spotify's player beside it. Spotify only loads when this window opens (see the Privacy page).
// The playlist link lives in data/site.ts.
export function Playlist({ onClose }: { onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={root} className="mv-room fixed inset-0 z-[80] flex flex-col text-ink" role="dialog" aria-modal="true" aria-label="Playlist" data-lenis-prevent>
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-3 md:px-page md:pt-6">
        <div className="min-w-0">
          <p className="t-eyebrow text-accent">Playlist</p>
          <h2 className="mt-1 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
            The <span className="text-red">MAD LADS</span> mix.
          </h2>
        </div>
        <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
          <CloseIcon className="size-5" />
        </button>
      </header>

      <div className="thin-scroll flex min-h-0 flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-4 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] md:flex-row md:gap-14 md:px-page">
        {/* The cassette as a sticker: a white die-cut edge around its own shape, slightly lifted */}
        <div className="shrink-0 max-md:hidden">
          <Image src="/holders/bag/cassette.webp" alt="" width={560} height={378} className="mv-sticker w-[min(34vw,420px)]" />
        </div>

        <div className="flex w-full max-w-[560px] flex-col gap-4">
          <iframe
            title="The MAD LADS mix on Spotify"
            src={spotifyEmbed}
            className="h-[min(62svh,560px)] w-full rounded-xl bg-ink/5 shadow-[0_26px_50px_-24px_rgba(60,20,10,0.45)]"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button href={links.playlist} variant="secondary" external>
              Open in Spotify ↗
            </Button>
            <p className="text-xs text-muted">Log in to Spotify in this browser to hear full tracks, not just previews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
