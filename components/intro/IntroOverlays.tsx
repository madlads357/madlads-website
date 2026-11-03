"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { STACKED } from "../Logo";

// "Bolt strike" intro: the lightning bolt of the official logo draws itself, the letters
// snap in, the screen flashes brand red, then a curtain wipes up onto the hero.
// The whole sequence is CSS (see "Intro loader" in globals.css); this component only
// handles timing, skipping and clean-up. Click, any key or "Skip intro" skips it.
const CURTAIN_AT = 1250; // ms — the curtain starts lifting and the hero headline rises
const DONE_AT = 1850; // ms — overlay fully gone

export function IntroOverlays() {
  const done = useRef(false);

  const finish = useCallback((reveal: number, remove: number) => {
    if (done.current) return;
    done.current = true;
    const root = document.documentElement;
    window.setTimeout(() => root.setAttribute("data-intro-out", ""), reveal);
    window.setTimeout(() => {
      root.removeAttribute("data-intro");
      root.removeAttribute("data-intro-out");
      window.__lenis?.start();
    }, remove);
  }, []);

  const skip = useCallback(() => finish(0, 220), [finish]);

  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-intro")) return;
    window.__lenis?.stop();
    window.addEventListener("keydown", skip);
    const t = window.setTimeout(() => finish(0, DONE_AT - CURTAIN_AT), CURTAIN_AT);
    return () => {
      window.removeEventListener("keydown", skip);
      window.clearTimeout(t);
    };
  }, [finish, skip]);

  return (
    <div className="intro intro-bolt fixed inset-0 z-[100] place-items-center" role="presentation" onClick={skip}>
      <svg viewBox="0 0 176 191" className="intro-mark h-[min(46svh,340px)] w-auto overflow-visible" aria-hidden>
        {STACKED.map((d, i) =>
          i === 0 ? <path key={i} d={d} className="bolt" pathLength={1} /> : <path key={i} d={d} className="letter" style={{ "--i": i } as CSSProperties} />,
        )}
      </svg>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          skip();
        }}
        className="t-eyebrow absolute right-5 bottom-5 rounded-full px-4 py-2.5 text-white/70 ring-1 ring-white/25 transition-colors hover:bg-white/10 md:right-8 md:bottom-8"
      >
        Skip intro
      </button>
    </div>
  );
}
