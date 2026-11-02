import type { CSSProperties } from "react";

// Text that lights up word by word as it scrolls through the viewport (pure CSS:
// a named view timeline on the paragraph, one staggered range per word).
// Screen readers and browsers without support get the plain sentence.
export function ScrollWords({ text, className = "", start = 18, end = 52 }: { text: string; className?: string; start?: number; end?: number }) {
  const words = text.split(" ");
  const step = (end - start) / words.length;
  return (
    <p className={`scroll-words ${className}`}>
      {words.map((w, i) => {
        const from = start + i * step;
        const style = { animationRange: `cover ${from.toFixed(1)}% cover ${(from + step * 2.5).toFixed(1)}%` } as CSSProperties;
        return (
          <span key={i} className="scroll-word" style={style}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}
