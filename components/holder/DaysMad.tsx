"use client";

import { useEffect, useState } from "react";

// "936 days Mad": days since the holder got their first Lad, rolling up like a mechanical counter
// (each digit is a strip of 0–9 that slides to its value, the left ones last). Reduced motion: no roll.
export function DaysMad({ since }: { since: string }) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000));
  const digits = String(days).split("").map(Number);
  const [rolled, setRolled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRolled(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <span className="inline-flex tabular-nums" aria-label={`${days} days`}>
      {digits.map((d, i) => (
        <span key={i} className="relative inline-block h-[1em] overflow-hidden leading-none" aria-hidden>
          <span
            className="flex flex-col transition-transform duration-[1400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
            style={{ transform: `translateY(-${rolled ? d : 0}em)`, transitionDelay: `${(digits.length - 1 - i) * 120}ms` }}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block h-[1em] leading-none">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
