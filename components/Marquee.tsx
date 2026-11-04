"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ladImage, lads } from "@/data/lads";

// Endless strip of Lads (inspired by scrolltide.co's ticker band). Pure CSS motion: the list
// is rendered twice and slides by half its width. Pauses on hover, stops for reduced motion.
// Images are only requested once the strip is actually on screen, so they never compete
// with the hero (font + poster) for bandwidth on first load.
export function LadsMarquee() {
  const row = lads.slice(0, 18);
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisible(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} aria-label="Some of the MAD LADS" className="group overflow-hidden border-y border-line bg-paper py-8">
      <ul className="flex w-max animate-marquee gap-3 [--marquee-duration:70s] group-hover:[animation-play-state:paused]">
        {[...row, ...row].map((l, i) => (
          <li
            key={`${l.id}-${i}`}
            aria-hidden={i >= row.length}
            className="relative h-[150px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-sunken ring-1 ring-black/5 md:h-[200px] md:w-[160px]"
          >
            {visible && <Image src={ladImage(l.id)} alt={i < row.length ? `MAD LADS #${l.id}` : ""} fill sizes="160px" className="object-cover" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
