"use client";

import { useRef, type ReactNode } from "react";

// Trading-card effect for the 1/1s: the card tilts toward the pointer and a foil shine
// follows it. Only writes CSS variables (no React re-render); styles live in globals.css (.holo).
// Mouse/pen only. On touch screens a one-time shine sweeps across when the card scrolls in.
export function HoloTilt({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
      el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
      el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
      el.style.setProperty("--hyp", `${Math.min(1, Math.hypot(x - 0.5, y - 0.5) * 2)}`);
      el.dataset.active = "";
    });
  };

  const leave = () => {
    cancelAnimationFrame(frame.current);
    const el = ref.current;
    if (!el) return;
    delete el.dataset.active;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div ref={ref} className={`holo ${className}`} onPointerMove={move} onPointerLeave={leave}>
      <div className="holo-card">
        {children}
        <span className="holo-foil" aria-hidden />
        <span className="holo-glare" aria-hidden />
      </div>
    </div>
  );
}
