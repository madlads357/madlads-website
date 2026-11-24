// Shared bits for drawing the passport stamps (single ink colour = currentColor).
import type { ReactNode } from "react";

export const font = { fontFamily: "var(--font-sans)", fontWeight: 800 } as const;

// Shrinks long words so they fit a given width (rough: bold caps ≈ 0.62em per letter).
export const fit = (text: string, width: number, max: number) => Math.min(max, width / (text.length * 0.62));

export function Svg({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" fill="none" stroke="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

// A line of stamp text: filled, centred on x.
export function Label({ x, y, size, spacing, children }: { x: number; y: number; size: number; spacing?: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fill="currentColor" stroke="none" fontSize={size} letterSpacing={spacing} style={font}>
      {children}
    </text>
  );
}

// Points of a star / serrated circle, rounded so the server and the browser print the same numbers.
export function starPoints(cx: number, cy: number, spikes: number, outer: number, inner: number, start = -Math.PI / 2) {
  return Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = start + (i / (spikes * 2)) * Math.PI * 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}
