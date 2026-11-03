"use client";

import { useRef, type ReactNode } from "react";
import { thumbImage } from "@/lib/madlads";

// Moving the mouse over the area leaves a trail of random Mad Lads that pop in and fade away.
// Mouse/pen only, off for reduced motion. A small pool of <img> is reused (no React re-render);
// images are small optimized thumbnails, fetched only once the pointer first enters.
const POOL = 14;
const GAP = 90; // px of pointer travel between two Lads
const TOTAL = 9971;

const src = (id: number) => `/_next/image?url=${encodeURIComponent(thumbImage(id))}&w=256&q=70`;
const randomIds = (n: number) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * TOTAL));

export function LadTrail({ children, className = "" }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const state = useRef<{ ids: number[]; next: number; z: number; last: { x: number; y: number } | null; on: boolean }>({
    ids: [],
    next: 0,
    z: 1,
    last: null,
    on: false,
  });

  const enter = (e: React.PointerEvent) => {
    const s = state.current;
    s.on = e.pointerType !== "touch" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    s.last = null;
    if (!s.on || s.ids.length) return;
    s.ids = randomIds(POOL * 3);
    s.ids.forEach((id) => (new Image().src = src(id))); // warm the cache
  };

  const move = (e: React.PointerEvent) => {
    const s = state.current;
    const box = root.current?.getBoundingClientRect();
    const imgs = layer.current?.children;
    if (!s.on || !box || !imgs) return;
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    if (s.last && Math.hypot(x - s.last.x, y - s.last.y) < GAP) return;
    const dx = s.last ? x - s.last.x : 0;
    s.last = { x, y };

    const img = imgs[s.next % POOL] as HTMLImageElement;
    img.src = src(s.ids[s.next % s.ids.length]);
    img.style.zIndex = String(s.z++);
    s.next++;
    const w = img.offsetWidth || 120;
    const h = w * 1.25;
    const tilt = Math.max(-14, Math.min(14, dx / 8)) + (Math.random() * 8 - 4);
    const at = `translate(${x - w / 2}px, ${y - h / 2}px)`;
    img.getAnimations().forEach((a) => a.cancel());
    img.animate(
      [
        { opacity: 0, transform: `${at} scale(0.4) rotate(${tilt * 2}deg)` },
        { opacity: 1, transform: `${at} scale(1) rotate(${tilt}deg)`, offset: 0.18 },
        { opacity: 1, transform: `${at} scale(1) rotate(${tilt}deg)`, offset: 0.62 },
        { opacity: 0, transform: `${at} translateY(40px) scale(0.85) rotate(${tilt}deg)` },
      ],
      { duration: 1100, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "forwards" },
    );
  };

  return (
    <div ref={root} className={`relative isolate overflow-hidden ${className}`} onPointerEnter={enter} onPointerMove={move}>
      <div ref={layer} className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {Array.from({ length: POOL }, (_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} alt="" className="lad-trail-img" decoding="async" />
        ))}
      </div>
      {children}
    </div>
  );
}
