"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { lads, ladImage, type Lad } from "@/data/lads";
import { SearchIcon } from "./Icons";

// Homepage preview of the Mad Lads. Quick filters work on the preview set;
// pressing Enter in the search opens the full explorer on /madlads.
const filters: { label: string; test: (l: Lad) => boolean }[] = [
  { label: "All", test: () => true },
  { label: "LADS", test: (l) => l.gender === "Male" && l.type !== "Skull" },
  { label: "Lassies", test: (l) => l.gender === "Female" },
  { label: "Skulls", test: (l) => l.type === "Skull" },
];

const preview = lads.slice(0, 20);

export function RosterPreview() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const f = filters.find((x) => x.label === active)!;
    const q = query.replace(/\D/g, "");
    return preview.filter((l) => f.test(l) && (!q || String(l.id).includes(q)));
  }, [active, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter the roster">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={active === f.label}
              onClick={() => setActive(f.label)}
              className={`rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${active === f.label ? "border-ink bg-ink text-white" : "border-line bg-surface hover:border-ink"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <form
          action="/madlads"
          className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 sm:w-52"
          role="search"
        >
          <SearchIcon className="size-4 text-muted" />
          <label htmlFor="home-lad-search" className="sr-only">
            Find a LAD by number
          </label>
          <input
            id="home-lad-search"
            name="q"
            inputMode="numeric"
            placeholder="Find LAD #"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </form>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-3 lg:grid-cols-5">
        {shown.map((l, i) => (
          <li key={l.id} className="reveal" style={{ "--i": i % 5 } as CSSProperties}>
            <figure className="group relative aspect-[4/5] overflow-hidden rounded-[4px] bg-sunken">
              <Image
                src={ladImage(l.id)}
                alt={`MAD LADS #${l.id}, ${l.type}${l.gender === "Female" ? " Lassie" : ""}, ${l.background} background`}
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] group-hover:-rotate-1"
              />
              <figcaption className="absolute bottom-2 left-2 rounded-[3px] bg-white px-2 py-1 text-xs font-semibold">
                #{l.id}
              </figcaption>
            </figure>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="col-span-full py-12 text-center text-muted">
            Not in this preview. Press Enter to search all 9,971 MAD LADS.
          </li>
        )}
      </ul>
    </div>
  );
}
