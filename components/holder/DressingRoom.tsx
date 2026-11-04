"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { CloseIcon } from "@/components/Icons";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { loadCollection, originalImage, thumbImage, type Collection } from "@/lib/madlads";
import { accessories, iconSrc, layoutSrc, type Accessory } from "@/data/dressing-room";
import "./dressing-room.css";

// The Dressing Room (from the backpack), moved from the Culture Hub. Same paper world as the passport:
// the Lad is a print in a mirror (press and hold it to see the Lad as it is), the accessories are
// stickers on a sheet (pick one and it lands on the Lad with the passport's "thump"). Pick a Lad (yours,
// or any number), Lad / Lassie is set from its traits, "Surprise me" picks an outfit, then download or
// copy the result at full size (2048×2560). Accessories: data/dressing-room.ts. Styles: dressing-room.css.
const SIZE = { w: 2048, h: 2560 };
const MAX_ID = 9971;

export function DressingRoom({ lads, photo, onClose }: { lads: number[]; photo: number; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [lad, setLad] = useState(photo);
  const [lassie, setLassie] = useState(false);
  const [on, setOn] = useState<string[]>([]);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loaded, setLoaded] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [peek, setPeek] = useState(false); // pressing the mirror: the Lad without accessories
  const ladsSection = useRef<HTMLElement>(null);
  const numberInput = useRef<HTMLInputElement>(null);
  // Phones: the Lad picker is below the stickers; this brings it up, ready to type a number.
  const changeLad = () => {
    ladsSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    numberInput.current?.focus({ preventScroll: true });
  };
  useDialogFocus(root);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    loadCollection().then(setCollection, () => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Lad or Lassie follows the Lad's Gender trait (the switch can still override it).
  useEffect(() => {
    if (!collection) return;
    const gi = collection.traits.findIndex((t) => t.name === "Gender");
    const row = collection.lads.find((l) => l[0] === lad);
    if (row && gi >= 0 && row[gi + 1] >= 0) setLassie(collection.traits[gi].values[row[gi + 1]] === "Female");
  }, [collection, lad]);

  const active = accessories.filter((a) => on.includes(a.id)); // in stacking order
  const grey = active.some((a) => a.grey);
  const toggle = (a: Accessory) => setOn((list) => (list.includes(a.id) ? list.filter((x) => x !== a.id) : [...list, a.id]));
  // A random outfit: two or three accessories, never both "Deal w it" glasses at once.
  const surprise = () => {
    const pool = [...accessories].sort(() => Math.random() - 0.5);
    const picked: string[] = [];
    for (const a of pool) {
      if (picked.length >= 2 + Math.round(Math.random())) break;
      if (a.id.startsWith("dealwit") && picked.some((p) => p.startsWith("dealwit"))) continue;
      picked.push(a.id);
    }
    setOn(picked);
  };
  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((n) => (n === text ? null : n)), 3000);
  };

  const pick = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(query);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_ID) {
      setLad(n);
      setQuery("");
    } else say(`Mad Lads go from #1 to #${MAX_ID}.`);
  };

  // The final picture at full size: the Lad (through our image server, so the canvas can read it), then each accessory.
  const compose = async (): Promise<Blob> => {
    const load = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(src));
        img.src = src;
      });
    const c = document.createElement("canvas");
    c.width = SIZE.w;
    c.height = SIZE.h;
    const ctx = c.getContext("2d")!;
    const base = await load(`/_next/image?url=${encodeURIComponent(originalImage(lad))}&w=2048&q=75`);
    ctx.drawImage(base, 0, 0, SIZE.w, SIZE.h);
    if (grey) {
      const px = ctx.getImageData(0, 0, SIZE.w, SIZE.h);
      for (let i = 0; i < px.data.length; i += 4) {
        const y = 0.299 * px.data[i] + 0.587 * px.data[i + 1] + 0.114 * px.data[i + 2];
        px.data[i] = px.data[i + 1] = px.data[i + 2] = y;
      }
      ctx.putImageData(px, 0, 0);
    }
    for (const a of active) ctx.drawImage(await load(layoutSrc(a, lassie)), 0, 0, SIZE.w, SIZE.h);
    return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("no image"))), "image/png"));
  };
  const fileName = `mad-lad-${lad}${active.map((a) => `-${a.id}`).join("")}.png`;
  const download = async () => {
    setBusy(true);
    try {
      const url = URL.createObjectURL(await compose());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      say("Couldn’t make the image. Try again.");
    }
    setBusy(false);
  };
  const copy = async () => {
    setBusy(true);
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": compose() })]); // the promise keeps Safari's permission
      say("Copied: paste it anywhere.");
    } catch {
      say("This browser can’t copy images. Use Download instead.");
    }
    setBusy(false);
  };

  return (
    <div
      ref={root}
      className="dr-room fixed inset-0 z-[80] flex flex-col text-ink"
      role="dialog"
      aria-modal="true"
      aria-label="Dressing room"
      data-lenis-prevent
    >
      <header className="flex items-start justify-between gap-4 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2 md:px-page md:pt-6">
        <div>
          <p className="t-eyebrow text-accent">Dressing room</p>
          <h2 className="mt-1 text-[clamp(1.75rem,3.2vw,2.75rem)] leading-none font-bold tracking-[-0.04em]">
            Dress up <span className="text-red tabular-nums">#{lad}</span>.
          </h2>
        </div>
        <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface ring-1 ring-line transition hover:ring-ink">
          <CloseIcon className="size-5" />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-5 px-4 pt-3 pb-4 md:grid-cols-[auto_minmax(340px,1fr)] md:grid-rows-1 md:gap-12 md:px-page md:pb-6">
        {/* The mirror: the Lad as a print, slightly tilted. Press and hold to see it without accessories. */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            className="dr-print relative block aspect-[4/5] h-[34svh] cursor-grab select-none active:cursor-grabbing md:h-[min(calc(100svh-210px),720px)]"
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            onPointerCancel={() => setPeek(false)}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Press and hold to compare with the Lad as it is"
          >
            <span className="absolute inset-[10px] overflow-hidden rounded-[4px] bg-sunken">
              <Image
                key={lad}
                src={originalImage(lad)}
                alt={`Mad Lad #${lad}`}
                fill
                priority
                quality={75}
                draggable={false}
                sizes="(min-width: 768px) 40vw, 70vw"
                onLoad={() => setLoaded(lad)}
                className={`object-cover transition-[opacity,filter] duration-300 ${loaded === lad ? "opacity-100" : "opacity-0"} ${grey && !peek ? "grayscale" : ""}`}
              />
              {loaded !== lad && <span className="absolute inset-0 m-auto size-10 animate-spin rounded-full border-2 border-ink/15 border-t-ink" aria-hidden />}
              {!peek &&
                active.map((a) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={`${a.id}-${lassie}`} src={layoutSrc(a, lassie)} alt="" draggable={false} className="dr-layer pointer-events-none absolute inset-0 h-full w-full object-cover" />
                ))}
            </span>
            <span className="dr-tag absolute -bottom-3 left-5 rounded-[3px] bg-red px-2.5 py-1 text-xs font-bold tracking-wide text-white tabular-nums">#{lad}</span>
          </button>
          <p className="flex items-center gap-3 text-xs text-muted">
            {peek ? "The Lad as it is." : active.length ? "Press and hold to compare." : "Pick a sticker to dress it up."}
            <button type="button" onClick={changeLad} className="font-semibold text-accent underline underline-offset-4 md:hidden">
              Change Lad
            </button>
          </p>
        </div>

        {/* The tools: scroll inside on small screens, the actions stay at the bottom */}
        <div className="flex min-h-0 flex-col gap-4">
          <div className="thin-scroll -mr-2 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2 pb-2">
            {/* on phones the stickers come first: they are what you came for */}
            <section ref={ladsSection} className="flex scroll-mt-2 flex-col gap-3 max-md:order-last">
              <h3 className="t-eyebrow text-muted">Your Lads</h3>
              <div className="flex flex-wrap gap-2">
                {lads.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLad(id)}
                    aria-pressed={lad === id}
                    aria-label={`Dress Mad Lad #${id}`}
                    className={`relative size-14 overflow-hidden rounded-lg bg-sunken ring-2 transition ${lad === id ? "-translate-y-0.5 shadow-md ring-red" : "ring-transparent hover:-translate-y-0.5 hover:ring-ink/30"}`}
                  >
                    <Image src={thumbImage(id)} alt="" fill sizes="56px" quality={70} className="object-cover" />
                  </button>
                ))}
              </div>
              <form onSubmit={pick} className="flex gap-2">
                <label className="sr-only" htmlFor="any-lad">
                  Any Mad Lad by number
                </label>
                <input
                  id="any-lad"
                  ref={numberInput}
                  inputMode="numeric"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Any Lad, e.g. 5894"
                  className="min-w-0 flex-1 rounded-[4px] bg-surface px-4 py-3 text-sm ring-1 ring-line outline-none placeholder:text-muted focus:ring-2 focus:ring-ink"
                />
                <button type="submit" className="rounded-[4px] border-[1.5px] border-ink px-4 text-sm font-semibold transition-colors hover:bg-ink hover:text-white">
                  Try it
                </button>
              </form>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="t-eyebrow text-muted">Stickers{active.length ? ` · ${active.length} on` : ""}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex rounded-full bg-ink/[0.06] p-1 text-xs font-semibold" role="group" aria-label="Lad or Lassie">
                    {[false, true].map((w) => (
                      <button
                        key={String(w)}
                        type="button"
                        aria-pressed={lassie === w}
                        onClick={() => setLassie(w)}
                        className={`rounded-full px-3.5 py-1.5 transition ${lassie === w ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}
                      >
                        {w ? "Lassie" : "Lad"}
                      </button>
                    ))}
                  </div>
                  {active.length > 0 && (
                    <button type="button" onClick={() => setOn([])} className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink">
                      Reset
                    </button>
                  )}
                </div>
              </div>
              {/* The sticker sheet */}
              <ul className="dr-sheet grid grid-cols-3 gap-x-2 gap-y-4 rounded-2xl p-4 sm:grid-cols-4 lg:grid-cols-5">
                {accessories.map((a, i) => {
                  const isOn = on.includes(a.id);
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => toggle(a)}
                        aria-pressed={isOn}
                        className="dr-sticker group flex w-full flex-col items-center gap-1.5 text-center"
                        style={{ "--tilt": `${[-6, 4, -3, 7, -5, 3, -7, 5][i % 8]}deg` } as CSSProperties}
                      >
                        <span className="dr-sticker-face relative grid size-16 place-items-center rounded-2xl bg-surface md:size-[72px]">
                          <Image src={iconSrc(a)} alt="" width={52} height={52} className="size-11 object-contain md:size-12" />
                          {isOn && (
                            <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-red text-[11px] font-bold text-white shadow" aria-hidden>
                              ✓
                            </span>
                          )}
                        </span>
                        <span className={`text-[11px] leading-tight font-semibold ${isOn ? "text-accent" : "text-muted group-hover:text-ink"}`}>{a.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <button type="button" onClick={download} disabled={busy} className="rounded-[4px] bg-accent px-5 py-3.5 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink disabled:opacity-50">
              {busy ? "Making it…" : "Download"}
            </button>
            <button type="button" onClick={copy} disabled={busy} className="rounded-[4px] border-[1.5px] border-ink px-5 py-3 text-[15px] leading-none font-semibold transition-colors hover:bg-ink hover:text-white disabled:opacity-50">
              Copy
            </button>
            <button type="button" onClick={surprise} className="rounded-[4px] px-3 py-3 text-[15px] leading-none font-semibold text-accent underline-offset-4 hover:underline">
              Surprise me
            </button>
            <p className="text-xs text-muted" role="status" aria-live="polite">
              {note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
