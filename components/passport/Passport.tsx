"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { LogoHorizontal, LogoStacked } from "@/components/Logo";
import { siteHost } from "@/lib/site-url";
import { ONE_OF_ONE_TYPES, loadCollection, thumbImage, type Collection } from "@/lib/madlads";
import { Curious, FockIt, HolderSeal, Issued, Lassie, OnTheMap, OneOfOne, Role, SkullClub, Tier } from "./Stamps";
import { fmtDate, identityFields } from "./format";
import "./passport.css";

export type PassportData = {
  name: string;
  handle?: string;
  since?: string; // ISO date
  roles?: string[];
  curious?: boolean; // found the hidden spots in the MAD Horoscope (the "Curious" stamp)
  onMap?: boolean; // on the holder map (the "On the map" stamp): never where
  lads: number[];
  photo: number; // the Lad shown as the passport photo
  // Shared links (/passport/<token>) carry these instead of the full list of Lads:
  count?: number; // Lads held (default: lads.length)
  kinds?: { skull: boolean; oneOfOne: boolean; lassie: boolean }; // which kinds of Lad (default: worked out from the collection)
  issued?: string; // date of the "Issued" stamp (default: today)
};


// Where each stamp lands on the stamps page: position (% of the page), width (%), tilt (deg), ink colour.
const SLOTS: { x: number; y: number; w: number; r: number }[] = [
  { x: 5, y: 10, w: 56, r: -7 }, // FOCK IT.
  { x: 60, y: 5, w: 34, r: 9 }, // holder seal
  { x: 5, y: 34, w: 40, r: 5 }, // tier
  { x: 48, y: 33, w: 26, r: -10 },
  { x: 76, y: 37, w: 21, r: 14 },
  { x: 4, y: 56, w: 42, r: -5 },
  { x: 52, y: 58, w: 27, r: 8 },
  { x: 8, y: 75, w: 30, r: -9 },
  { x: 50, y: 82, w: 40, r: 4 },
];

// A full passport (every stamp, and the map one): ten stamps, a little smaller, in four rows.
const SLOTS_FULL: { x: number; y: number; w: number; r: number }[] = [
  { x: 4, y: 5, w: 54, r: -7 }, // FOCK IT.
  { x: 61, y: 3, w: 33, r: 9 }, // holder seal
  { x: 4, y: 24, w: 38, r: 5 }, // tier
  { x: 45, y: 28, w: 24, r: -10 },
  { x: 73, y: 30, w: 22, r: 14 },
  { x: 3, y: 42, w: 41, r: -5 },
  { x: 47, y: 50, w: 25, r: 8 },
  { x: 74, y: 49, w: 22, r: -6 },
  { x: 6, y: 62, w: 30, r: -9 },
  { x: 46, y: 74, w: 42, r: 4 },
];

// Everything at once (every kind of Lad, two roles, the map and Curious): eleven stamps, the last row with three.
const SLOTS_MAX: { x: number; y: number; w: number; r: number }[] = [
  ...SLOTS_FULL.slice(0, 8),
  { x: 4, y: 68, w: 25, r: -9 }, // map
  { x: 31, y: 76, w: 33, r: -4 }, // curious
  { x: 64, y: 69, w: 34, r: 4 }, // issued
];

type Ink = "red" | "black" | "blue" | "gold";
type StampItem = { key: string; ink: Ink; el: ReactNode };

export function Passport({ data, autoOpen, onDark }: { data: PassportData; autoOpen?: boolean; onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [stampsShown, setStampsShown] = useState(false); // phones: the stamps page is turned
  const [collection, setCollection] = useState<Collection | null>(null);
  const [today, setToday] = useState<string | null>(null); // set after mount: server and browser may disagree on "today"

  useEffect(() => {
    if (!data.kinds) loadCollection().then(setCollection, () => {}); // shared links already know the kinds
    setToday(new Date().toISOString());
  }, [data.kinds]);

  // In a window (the backpack), the passport opens by itself once it has appeared.
  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => setOpen(true), 450);
    return () => clearTimeout(t);
  }, [autoOpen]);

  // Stamps earned from the Lads held, the Discord roles and the holder map.
  const stamps = useMemo<StampItem[]>(() => {
    const out: StampItem[] = [{ key: "fock", ink: "red", el: <FockIt /> }];
    out.push({ key: "seal", ink: "red", el: <HolderSeal year={data.since ? data.since.slice(0, 4) : "2023"} /> });
    out.push({ key: "tier", ink: "black", el: <Tier count={data.count ?? data.lads.length} /> });
    const kinds = data.kinds ?? (collection ? kindsOf(collection, data.lads) : null);
    if (kinds?.skull) out.push({ key: "skull", ink: "black", el: <SkullClub /> });
    if (kinds?.oneOfOne) out.push({ key: "one", ink: "gold", el: <OneOfOne /> });
    if (kinds?.lassie) out.push({ key: "lassie", ink: "red", el: <Lassie /> });
    (data.roles ?? []).slice(0, 2).forEach((r, i) => out.push({ key: `role-${r}`, ink: i ? "red" : "black", el: <Role name={r} shape={i ? "tri" : "hex"} /> }));
    if (data.onMap) out.push({ key: "map", ink: "blue", el: <OnTheMap /> });
    if (data.curious) out.push({ key: "curious", ink: "red", el: <Curious /> });
    const issued = data.issued ?? today;
    if (issued) out.push({ key: "issued", ink: "blue", el: <Issued date={fmtDate(issued, { day: "2-digit", month: "short", year: "numeric" })} /> });
    return out.slice(0, SLOTS_MAX.length);
  }, [collection, data, today]);

  const identity = <IdentityPage data={data} />;
  const stampsPage = <StampsPage stamps={stamps} />;

  // Phones show one page at a time: tapping the open passport turns to the stamps page and back.
  const phone = () => window.matchMedia("(max-width: 47.99rem)").matches;
  const tapCover = () => {
    if (!open) setOpen(true);
    else if (phone()) setStampsShown(true);
    else setOpen(false);
  };
  const hint = !open ? "Tap the passport to open it." : stampsShown ? "Tap to go back to your passport." : "Tap to see your stamps.";

  return (
    <div className="pp" data-open={open || undefined}>
      {/* Desktop: a booklet that opens like a book. Phones: a card that flips, then turns to the stamps. */}
      <div className="pp-book">
        <div className="pp-page pp-right max-md:hidden">{stampsPage}</div>
        <button type="button" className="pp-cover" onClick={tapCover} aria-expanded={open} aria-label={open ? "Your passport" : "Open the passport"}>
          <span className="pp-face pp-front">
            <Cover />
          </span>
          <span className="pp-face pp-back">{identity}</span>
        </button>
        <button
          type="button"
          className="pp-page pp-mobile-stamps md:hidden"
          data-show={(open && stampsShown) || undefined}
          onClick={() => setStampsShown(false)}
          aria-label="Back to the passport"
        >
          {stampsPage}
        </button>
      </div>
      <p className={`mt-4 text-center text-sm ${onDark ? "text-white/70" : "text-muted"}`}>
        <span className="md:hidden">{hint}</span>
        <span className="max-md:hidden">{open ? "Tap the passport to close it." : "Tap the passport to open it."}</span>
      </p>
    </div>
  );
}

// Which kinds of Lad the holder has, for the Skull / 1/1 / Lassie stamps.
function kindsOf(collection: Collection, ids: number[]) {
  const ti = collection.traits.findIndex((t) => t.name === "Type");
  const gi = collection.traits.findIndex((t) => t.name === "Gender");
  const held = ids.map((id) => collection.lads.find((l) => l[0] === id)).filter((l): l is number[] => !!l);
  const types = held.map((l) => collection.traits[ti].values[l[ti + 1]]);
  return {
    skull: types.includes("Skull"),
    oneOfOne: types.some((t) => ONE_OF_ONE_TYPES.includes(t)),
    lassie: held.some((l) => l[gi + 1] >= 0 && collection.traits[gi].values[l[gi + 1]] === "Female"),
  };
}

/* ------------------------------------------------------------ Pages */

function Cover() {
  return (
    <span className="pp-paper-grain flex h-full flex-col items-center justify-between bg-[#b31220] px-[8cqw] py-[10cqw] text-[#f6f1e8]">
      <span className="text-[4.4cqw] font-semibold tracking-[0.42em]">MAD LADS PASSPORT</span>
      <LogoStacked className="pp-emboss w-[44cqw] text-[#f62038]" title="" />
      <span className="flex w-full items-end justify-between">
        <span className="text-[3cqw] font-semibold tracking-[0.3em] opacity-70">EVERYONE’S MAD HERE.</span>
        <span className="pp-ink w-[26cqw] -rotate-12 text-[#f6f1e8]" style={{ "--mx": "40%", "--my": "10%" } as CSSProperties}>
          <FockIt />
        </span>
      </span>
    </span>
  );
}

function IdentityPage({ data }: { data: PassportData }) {
  const fields = identityFields(data).map((f) => ({ ...f, label: f.key === "x" ? <XLogo /> : f.label }));

  return (
    <span className="pp-paper flex h-full flex-col px-[7cqw] py-[8cqw] text-left text-ink">
      <span className="flex items-center justify-between">
        <span className="text-[3.6cqw] font-bold tracking-[0.32em] text-accent">MAD LADS PASSPORT</span>
        <LogoHorizontal className="w-[22cqw] text-red" title="" />
      </span>

      {/* Photo on the left, the Lad number beside it; the stamp lands across the photo's edge */}
      <span className="relative mt-[7cqw] flex gap-[5cqw]">
        <span className="relative block aspect-[4/5] w-[48cqw] shrink-0 overflow-hidden rounded-[2.4cqw] bg-sunken ring-1 ring-black/10">
          <Image src={thumbImage(data.photo)} alt={`MAD LADS #${data.photo}`} fill sizes="300px" className="object-cover" />
        </span>
        <span className="flex flex-col gap-[1.2cqw] pt-[1cqw]">
          <span className="text-[2.8cqw] font-semibold tracking-[0.2em] text-accent">LAD NO.</span>
          <span className="text-[8cqw] leading-none font-bold tracking-[-0.04em] tabular-nums">#{data.photo}</span>
        </span>
        <span className="absolute right-[-2cqw] bottom-[3cqw] block w-[38cqw] text-[#d11a2e]">
          <span className="pp-stamp pp-ink block" style={{ "--r": "-12deg", "--i": 8, "--mx": "10%", "--my": "60%" } as CSSProperties}>
            <FockIt />
          </span>
        </span>
      </span>

      <span className="mt-[6cqw] grid grid-cols-2 gap-x-[5cqw] gap-y-[3.5cqw] border-t border-line pt-[4cqw]">
        {fields.map((f) => (
          <span key={f.key} className="flex min-w-0 flex-col gap-[0.8cqw]">
            <span className="flex h-[3.4cqw] items-center text-[2.8cqw] font-semibold tracking-[0.2em] text-accent uppercase">{f.label}</span>
            <span className="truncate text-[4.6cqw] leading-tight font-bold tracking-[-0.02em]">{f.value}</span>
          </span>
        ))}
      </span>

      <span className="mt-auto text-center text-[2.6cqw] font-semibold tracking-[0.34em] text-muted">{siteHost.toUpperCase()} · FOCK IT.</span>
    </span>
  );
}

function StampsPage({ stamps }: { stamps: StampItem[] }) {
  const slots = stamps.length > SLOTS_FULL.length ? SLOTS_MAX : stamps.length > SLOTS.length ? SLOTS_FULL : SLOTS;
  return (
    <span className="pp-paper relative block h-full">
      <span className="absolute top-[4cqw] left-[7cqw] text-[3cqw] font-semibold tracking-[0.3em] text-muted">STAMPS</span>
      {stamps.map((s, i) => {
        const slot = slots[i];
        return (
          <span
            key={s.key}
            className={`pp-stamp absolute block ${s.ink === "gold" ? "" : "pp-ink"} pp-ink-${s.ink}`}
            style={
              {
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `${slot.w}%`,
                "--r": `${slot.r}deg`,
                "--i": i,
                "--mx": `${(i * 37) % 100}%`,
                "--my": `${(i * 61) % 100}%`,
              } as CSSProperties
            }
          >
            {s.el}
          </span>
        );
      })}
    </span>
  );
}

// X (Twitter) logo, sized to the field labels.
const XLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[3.2cqw] w-auto" role="img" aria-label="X">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
