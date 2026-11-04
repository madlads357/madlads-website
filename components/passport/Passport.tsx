"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { LogoHorizontal, LogoStacked } from "@/components/Logo";
import { ONE_OF_ONE_TYPES } from "@/components/MadLadsExplorer";
import { loadCollection, thumbImage, type Collection } from "@/lib/madlads";
import { FockIt, HolderSeal, Issued, Lassie, OneOfOne, Role, SkullClub, Tier } from "./Stamps";
import "./passport.css";

export type PassportData = {
  name: string;
  handle?: string;
  since?: string; // ISO date
  roles?: string[];
  lads: number[];
  photo: number; // the Lad shown as the passport photo
};

const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" }).toUpperCase();

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

type Ink = "red" | "black" | "blue" | "gold";
type StampItem = { key: string; ink: Ink; el: ReactNode };

export function Passport({ data, autoOpen, onDark }: { data: PassportData; autoOpen?: boolean; onDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [today, setToday] = useState<string | null>(null); // set after mount: server and browser may disagree on "today"

  useEffect(() => {
    loadCollection().then(setCollection, () => {});
    setToday(new Date().toISOString());
  }, []);

  // In a window (the backpack), the passport opens by itself once it has appeared.
  useEffect(() => {
    if (!autoOpen) return;
    const t = setTimeout(() => setOpen(true), 450);
    return () => clearTimeout(t);
  }, [autoOpen]);

  // Stamps earned from the Lads held and the Discord roles.
  const stamps = useMemo<StampItem[]>(() => {
    const out: StampItem[] = [{ key: "fock", ink: "red", el: <FockIt /> }];
    out.push({ key: "seal", ink: "red", el: <HolderSeal year={data.since ? data.since.slice(0, 4) : "2023"} /> });
    out.push({ key: "tier", ink: "black", el: <Tier count={data.lads.length} /> });
    if (collection) {
      const ti = collection.traits.findIndex((t) => t.name === "Type");
      const gi = collection.traits.findIndex((t) => t.name === "Gender");
      const held = data.lads.map((id) => collection.lads.find((l) => l[0] === id)).filter((l): l is number[] => !!l);
      const types = held.map((l) => collection.traits[ti].values[l[ti + 1]]);
      if (types.includes("Skull")) out.push({ key: "skull", ink: "black", el: <SkullClub /> });
      if (types.some((t) => ONE_OF_ONE_TYPES.includes(t))) out.push({ key: "one", ink: "gold", el: <OneOfOne /> });
      if (held.some((l) => l[gi + 1] >= 0 && collection.traits[gi].values[l[gi + 1]] === "Female")) out.push({ key: "lassie", ink: "red", el: <Lassie /> });
    }
    (data.roles ?? []).slice(0, 2).forEach((r, i) => out.push({ key: `role-${r}`, ink: i ? "red" : "black", el: <Role name={r} shape={i ? "tri" : "hex"} /> }));
    if (today) out.push({ key: "issued", ink: "blue", el: <Issued date={fmtDate(today, { day: "2-digit", month: "short", year: "numeric" })} /> });
    return out.slice(0, SLOTS.length);
  }, [collection, data, today]);

  const identity = <IdentityPage data={data} />;
  const stampsPage = <StampsPage stamps={stamps} />;

  return (
    <div className="pp" data-open={open || undefined}>
      {/* Desktop: a booklet that opens like a book. Mobile: a card that flips, with the stamps below. */}
      <div className="pp-book">
        <div className="pp-page pp-right max-md:hidden">{stampsPage}</div>
        <button
          type="button"
          className="pp-cover"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close the passport" : "Open the passport"}
        >
          <span className="pp-face pp-front">
            <Cover />
          </span>
          <span className="pp-face pp-back">{identity}</span>
        </button>
      </div>
      <div className="pp-page pp-mobile-stamps md:hidden">{stampsPage}</div>
      <p className={`mt-6 text-center text-sm ${onDark ? "text-white/70" : "text-muted"}`}>{open ? "Tap the passport to close it." : "Tap the passport to open it."}</p>
    </div>
  );
}

/* ------------------------------------------------------------ Pages */

function Cover() {
  return (
    <span className="pp-paper-grain flex h-full flex-col items-center justify-between bg-[#b31220] px-[8cqw] py-[10cqw] text-[#f6f1e8]">
      <span className="text-[4.4cqw] font-semibold tracking-[0.42em]">LADS PASSPORT</span>
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
  const fields = [
    { key: "name", label: "Name", value: data.name },
    data.handle && { key: "x", label: <XLogo />, value: `@${data.handle}` }, // the X logo stands in for a "Handle" label
    data.since && { key: "since", label: "Mad since", value: fmtDate(data.since, { month: "long", year: "numeric" }) },
    { key: "lads", label: "Lads held", value: String(data.lads.length) },
  ].filter(Boolean) as { key: string; label: ReactNode; value: string }[];

  return (
    <span className="pp-paper flex h-full flex-col px-[7cqw] py-[8cqw] text-left text-ink">
      <span className="flex items-center justify-between">
        <span className="text-[3.6cqw] font-bold tracking-[0.32em] text-accent">LADS PASSPORT</span>
        <LogoHorizontal className="w-[22cqw] text-red" title="" />
      </span>

      {/* Photo on the left, the Lad number beside it; the stamp lands across the photo's edge */}
      <span className="relative mt-[7cqw] flex gap-[5cqw]">
        <span className="relative block aspect-[4/5] w-[48cqw] shrink-0 overflow-hidden rounded-[2.4cqw] bg-sunken ring-1 ring-black/10">
          <Image src={thumbImage(data.photo)} alt={`Mad Lad #${data.photo}`} fill sizes="300px" className="object-cover" />
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

      <span className="mt-auto text-center text-[2.6cqw] font-semibold tracking-[0.34em] text-muted">MADLADS.COM · FOCK IT.</span>
    </span>
  );
}

function StampsPage({ stamps }: { stamps: StampItem[] }) {
  return (
    <span className="pp-paper relative block h-full">
      <span className="absolute top-[4cqw] left-[7cqw] text-[3cqw] font-semibold tracking-[0.3em] text-muted">STAMPS</span>
      {stamps.map((s, i) => {
        const slot = SLOTS[i];
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
