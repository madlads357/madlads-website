"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

// Unfolding accordion (inspired by easyui's "Unfold Accordion"). One item open at a time,
// smooth height animation via grid rows, + turns into × when open.
export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <li
            key={it.q}
            style={{ "--i": i } as CSSProperties}
            className={`reveal rounded-2xl transition-colors duration-300 ${isOpen ? "bg-surface shadow-[0_12px_32px_-20px_rgba(17,17,17,0.35)]" : "bg-surface/60 hover:bg-surface"}`}
          >
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 p-5 text-left md:p-6"
              >
                <span className="text-lg font-semibold tracking-tight md:text-xl">{it.q}</span>
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full transition-all duration-300 ${isOpen ? "rotate-45 bg-accent text-white" : "bg-sunken"}`}
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>
            </h3>
            <div id={id} role="region" className={`grid transition-[grid-template-rows] duration-400 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className={`t-body-l max-w-[760px] px-5 pb-6 text-muted transition-opacity duration-300 md:px-6 ${isOpen ? "opacity-100" : "opacity-0"}`}>{it.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
