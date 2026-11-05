"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { HolderLads } from "./HolderLads";
import { DaysMad } from "./DaysMad";
import { PassportWindow } from "@/components/passport/PassportWindow";
import { LockIcon } from "@/components/Icons";
import { bagItems, isBagWindow, type BagItem, type BagWindow } from "@/data/bag";
import { MemeVault } from "./MemeVault";
import { DressingRoom } from "./DressingRoom";
import { Playlist } from "./Playlist";
import { PHOTO_EVENT, PHOTO_KEY } from "@/lib/auth/hint";
import "./bag.css";

type Props = {
  name: string;
  handle?: string;
  since?: string;
  roles?: string[];
  lads: number[];
  photo?: number; // the saved passport photo (database), if any
};

// Where the bag's opening is, as a fraction of the backpack image (objects fly out from there).
const MOUTH = { x: 0.25, y: 0.62 };
// Desktop: where the sticky bag sits on screen (px). The fall maths in Items uses the same numbers.
const STICKY = { top: 110, pad: 40 };

export function HolderProfile({ name, handle, since, roles, lads, photo: saved }: Props) {
  const [photo, setPhoto] = useState(saved ?? lads[0]);
  const [windowOpen, setWindowOpen] = useState<BagWindow | null>(null); // the window a backpack object opened (data/bag.ts)
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => window.scrollY > 60 && setScrolled(true);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Without a saved photo (no database), fall back to the one remembered in this browser.
  useEffect(() => {
    if (saved) return;
    try {
      const local = Number(localStorage.getItem(PHOTO_KEY));
      if (lads.includes(local)) setPhoto(local);
    } catch { }
  }, [lads, saved]);

  const choosePhoto = (id: number) => {
    setPhoto(id);
    try {
      localStorage.setItem(PHOTO_KEY, String(id));
    } catch { }
    window.dispatchEvent(new CustomEvent(PHOTO_EVENT, { detail: id })); // the header picture follows
    fetch("/api/holder/photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo: id }) }).catch(() => { }); // every device
  };

  const closeWindow = useCallback(() => setWindowOpen(null), []);

  const n = lads.length;
  const sinceText = since ? new Date(since).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : null;

  return (
    <div className="px-4 md:px-page">
      <div className="grid gap-x-16 lg:grid-cols-[1fr_minmax(300px,32%)]">
        <div className="min-w-0 pb-24 md:pb-32">
          {/* Fills the first screen on desktop: the objects only start falling once you scroll */}
          <div className="flex flex-col justify-center lg:min-h-[calc(100svh-88px)] lg:pb-16">
            <header className="flex flex-col gap-6 pt-14 pb-10 md:pt-20 lg:pt-0">
              <p className="t-eyebrow text-accent">Holders</p>
              <h1 className="t-display-l">
                Welcome back,
                <br />
                <span className="text-red">{name}.</span>
              </h1>
              <dl className="flex flex-wrap items-end gap-x-10 gap-y-5">
                {since && sinceText && <Stat value={<DaysMad since={since} />} label={`Days MAD · since ${sinceText}`} />}
                <Stat value={n} label={"MAD LADS"} />
              </dl>
            </header>

            <HolderLads ids={lads} photo={photo} onPhoto={choosePhoto} />
          </div>

          {/* On phones the bag sits here, above what falls out of it */}
          <div className="mt-10 flex justify-end lg:hidden">
            <Backpack hop={!scrolled} className="w-[58%] max-w-[300px]" />
          </div>

          <Items onOpen={setWindowOpen} />
        </div>

        {/* Desktop: the bag stays in view while the objects fall out */}
        <div className="relative max-lg:hidden">
          <div className="sticky" style={{ top: STICKY.top, paddingTop: STICKY.pad }}>
            <Backpack hop={!scrolled} className="bag-wiggle w-full" />
          </div>
        </div>
      </div>

      {windowOpen === "passport" && <PassportWindow data={{ name, handle, since, roles, lads, photo }} onClose={closeWindow} />}
      {windowOpen === "memes" && <MemeVault onClose={closeWindow} />}
      {windowOpen === "dressing" && <DressingRoom lads={lads} photo={photo} onClose={closeWindow} />}
      {windowOpen === "playlist" && <Playlist onClose={closeWindow} />}
    </div>
  );
}

function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-2">
      <dt className="t-eyebrow text-muted">{label}</dt>
      <dd className="text-[clamp(2.25rem,4vw,3.25rem)] leading-none font-bold tracking-[-0.04em] tabular-nums">{value}</dd>
    </div>
  );
}

// hop: a little jump now and then, to say "something is inside", until the visitor scrolls.
function Backpack({ className = "", hop }: { className?: string; hop?: boolean }) {
  return (
    <div className={`relative ${hop ? "bag-hop" : ""} ${className}`} data-bag>
      <Image src="/holders/bag/backpack.webp" alt="Your MAD LADS backpack" width={892} height={900} priority sizes="(min-width: 1024px) 30vw, 58vw" className="h-auto w-full" />
      <span data-bag-mouth className="absolute size-1" style={{ left: `${MOUTH.x * 100}%`, top: `${MOUTH.y * 100}%` }} aria-hidden />
    </div>
  );
}

/* ------------------------------------------------------------ Falling objects */

// Each object starts at the bag's opening and lands in its slot as it scrolls into view.
// The scroll drives the animation (CSS, bag.css); JS only measures how far each slot is from the bag.
function Items({ onOpen }: { onOpen: (w: BagWindow) => void }) {
  const list = useRef<HTMLUListElement>(null);

  const measure = useCallback(() => {
    const ul = list.current;
    if (!ul) return;
    const bags = [...document.querySelectorAll<HTMLElement>("[data-bag]")].filter((b) => b.offsetParent !== null);
    const mouth = bags[0]?.querySelector<HTMLElement>("[data-bag-mouth]");
    const desktop = window.matchMedia("(min-width: 64rem)").matches;
    const vh = window.innerHeight;
    const m = mouth?.getBoundingClientRect();
    const slots = [...ul.querySelectorAll<HTMLElement>("[data-slot]")];
    slots.forEach((slot) => {
      const r = slot.getBoundingClientRect();
      const col = slots.filter((s) => Math.round(s.offsetTop) === Math.round(slot.offsetTop)).indexOf(slot);
      const lead = col * 0.12 * r.height; // matches "entry calc(var(--col) * 12%)" in bag.css
      let fy: number;
      let d: number;
      if (desktop && m) {
        // The bag is sticky: its opening stays at the same height on screen while the page scrolls.
        // When the fall starts, the slot's center is at vh + h/2 - lead; the page then scrolls h - lead.
        const mouthY = STICKY.top + STICKY.pad + (m.top - bags[0].getBoundingClientRect().top);
        fy = mouthY - (vh + r.height / 2 - lead);
        d = r.height - lead;
      } else {
        // Phones: the bag scrolls with the page, so the path is in page coordinates (no scroll to make up).
        fy = m ? Math.max(m.top - (r.top + r.height / 2), -0.7 * vh) : -0.5 * vh;
        d = 0;
      }
      const fx = m ? m.left - (r.left + r.width / 2) : r.width;
      slot.style.setProperty("--col", String(col));
      slot.style.setProperty("--fx", `${Math.round(fx)}px`);
      slot.style.setProperty("--fy", `${Math.round(fy)}px`);
      slot.style.setProperty("--d", `${Math.round(d)}px`);
    });
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300); // after images and fonts settle
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [measure]);

  return (
    <ul ref={list} className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 md:mt-16 md:grid-cols-3 md:gap-x-10 md:gap-y-12">
      {bagItems.map((item, i) => (
        <li key={item.id} data-slot className="bag-slot" style={{ "--r": `${item.tilt}deg`, "--col": i % 3 } as CSSProperties}>
          <div className="bag-fall-x">
            <div className="bag-fall-y">
              <div className="bag-spin">
                <Item item={item} onOpen={onOpen} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Item({ item, onOpen }: { item: BagItem; onOpen: (w: BagWindow) => void }) {
  const locked = item.open === null;
  const external = !locked && !isBagWindow(item.open); // opens another site in a new tab
  const body = (
    <>
      {/* fixed box, image centered inside: every label lines up whatever the object's shape */}
      <span className="bag-object relative block aspect-[5/4] w-full">
        <Image
          src={item.image}
          alt=""
          width={item.w}
          height={item.h}
          sizes="(min-width: 768px) 20vw, 40vw"
          className={`absolute inset-0 m-auto h-auto w-auto ${locked ? "opacity-60 grayscale" : ""}`}
          style={{ maxWidth: `${88 * (item.scale ?? 1)}%`, maxHeight: `${88 * (item.scale ?? 1)}%` }}
        />
        {locked && (
          <span className="absolute inset-0 m-auto grid size-11 place-items-center rounded-full bg-white shadow-md">
            <LockIcon className="size-5" />
          </span>
        )}
      </span>
      <span className="mt-3 flex flex-col items-center gap-1 text-center">
        <span className="border-b-2 border-red pb-0.5 text-lg leading-tight font-semibold tracking-tight">
          {item.label}
          {external && (
            <>
              <span aria-hidden className="ml-1 inline-block text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </>
          )}
        </span>
        <span className="text-sm text-muted">{locked ? "Soon" : item.hint}</span>
      </span>
    </>
  );
  const cls = "group flex w-full flex-col items-center rounded-2xl outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent";

  if (isBagWindow(item.open)) {
    const w = item.open;
    return (
      <button type="button" onClick={() => onOpen(w)} className={cls} aria-label={{ passport: "Open your MAD LADS Passport", memes: "Open the meme vault", dressing: "Open the dressing room", playlist: "Play the MAD LADS mix" }[w]}>
        {body}
      </button>
    );
  }
  if (locked)
    return (
      <div className={`${cls} cursor-default`} aria-label={`${item.label}, coming soon`}>
        {body}
      </div>
    );
  return (
    <a href={item.open!} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  );
}
