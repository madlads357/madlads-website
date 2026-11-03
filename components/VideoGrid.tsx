"use client";

import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";
import type { IrlVideo } from "@/data/irl";
import { CloseIcon } from "./Icons";

// "Lite" YouTube: only the thumbnail loads with the page; the player (and YouTube's
// ~1 MB of scripts) loads in a lightbox when someone actually presses play.
export function VideoGrid({ videos }: { videos: IrlVideo[] }) {
  const [playing, setPlaying] = useState<IrlVideo | null>(null);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPlaying(null);
    window.addEventListener("keydown", onKey);
    window.__lenis?.stop();
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.__lenis?.start();
      document.body.style.overflow = "";
    };
  }, [playing]);

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {videos.map((v, i) => (
          <li key={v.id} className="reveal" style={{ "--i": i % 4 } as CSSProperties}>
            <button type="button" onClick={() => setPlaying(v)} className="group flex w-full flex-col gap-3 text-left" aria-label={`Play video: ${v.title}, ${v.where}`}>
              <span className="relative block aspect-video overflow-hidden rounded-xl bg-ink ring-1 ring-white/10">
                <Image
                  src={`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover opacity-85 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur transition-transform duration-300 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" className="ml-0.5 size-6" fill="currentColor" aria-hidden>
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">{v.where}</span>
              </span>
              <span className="font-semibold leading-snug text-white group-hover:text-red">{v.title}</span>
            </button>
          </li>
        ))}
      </ul>

      {playing && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={playing.title} data-lenis-prevent>
          <button type="button" className="absolute inset-0 bg-black/85 backdrop-blur-sm" aria-label="Close video" onClick={() => setPlaying(null)} />
          <div className="relative w-full max-w-5xl animate-[pop_200ms_ease-out]">
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <p className="font-semibold">
                {playing.title} <span className="text-white/60">· {playing.where}</span>
              </p>
              <button type="button" onClick={() => setPlaying(null)} aria-label="Close video" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20">
                <CloseIcon className="size-5" />
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&modestbranding=1`}
                title={playing.title}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
