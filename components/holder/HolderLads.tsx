"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { LadDialog, Tile, inView, morph } from "@/components/MadLadsExplorer";
import { loadCollection, thumbImage, type Collection } from "@/lib/madlads";

// The holder's own Lads.
// Folded (default): one row of overlapping cards like a hand of cards. When they don't all fit,
// the last card is "+X": a click unfolds the hand into a full grid, each card gliding to its
// place (View Transitions). Clicking a Lad opens the explorer's detail pop-up (← → browse only
// this holder's Lads), with a button to make it the passport photo.
export function HolderLads({ ids, photo, onPhoto }: { ids: number[]; photo: number; onPhoto: (id: number) => void }) {
  const [data, setData] = useState<Collection | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [unfolded, setUnfolded] = useState(false);

  // The full collection (traits and rarity, 87 KB) is only needed for the pop-up: it starts
  // loading when the pointer or a finger reaches the Lads, not with the page.
  const prefetch = () => {
    if (!data) loadCollection().then(setData, () => {});
  };

  // How many cards fit on one row while each still shows at least half of itself.
  const box = useRef<HTMLDivElement>(null);
  const [perRow, setPerRow] = useState<number | null>(null); // null until measured: the row stays invisible, no jump
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => {
      const card = parseFloat(getComputedStyle(el).getPropertyValue("--card")) || 132;
      setPerRow(Math.max(2, Math.floor((el.clientWidth - card) / (card * 0.5)) + 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The passport photo leads the hand, so it is always visible when folded.
  const ordered = ids.includes(photo) ? [photo, ...ids.filter((id) => id !== photo)] : ids;
  const fits = perRow ?? 5;
  const overflow = ordered.length > fits;
  const hand = overflow ? ordered.slice(0, fits - 1) : ordered;
  const hidden = ordered.length - hand.length;

  const index = open === null ? -1 : ordered.indexOf(open);
  const lad = open === null ? undefined : data?.lads.find((l) => l[0] === open);

  const openFrom = (id: number, tile: HTMLElement) => {
    if (data) return morph(() => setOpen(id), tile);
    loadCollection().then((d) => {
      setData(d);
      morph(() => setOpen(id), tile);
    }, () => {});
  };
  const close = () =>
    morph(
      () => setOpen(null),
      null,
      () => inView(document.querySelector(`[data-lad="${open}"]`)),
    );
  const toggle = () => unfold(box.current, () => setUnfolded((u) => !u));

  const card = (id: number, overlap: boolean) => {
    return (
      <li
        key={id}
        data-card={id}
        className={`relative ${overlap ? "w-(--card)" : "w-full"} rounded-xl transition-transform duration-300 ease-out focus-within:z-20 hover:z-20 hover:-translate-y-2 ${
          overlap ? "[&:not(:first-child)]:shadow-[-10px_0_18px_-10px_rgba(17,17,17,0.45)]" : ""
        }`}
      >
        <Tile
          id={id}
          priority={ordered.indexOf(id) < 6}
          onOpen={(el) => openFrom(id, el)}
        />
        {id === photo && (
          <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-semibold tracking-wide text-white uppercase backdrop-blur">Passport</span>
        )}
      </li>
    );
  };

  return (
    <>
      <div
        ref={box}
        onPointerEnter={prefetch}
        onTouchStart={prefetch}
        onFocus={prefetch}
        className={`pt-3 [--card:104px] md:[--card:132px] ${perRow === null ? "invisible" : ""}`}
      >
        {!unfolded ? (
          // Folded: cards share the width and overlap; the last column keeps a full card.
          <ul
            className="grid"
            style={{
              gridTemplateColumns:
                hand.length + (overflow ? 1 : 0) > 1
                  ? `repeat(${hand.length + (overflow ? 1 : 0) - 1}, minmax(0, calc(var(--card) + 12px))) var(--card)`
                  : "var(--card)",
            }}
          >
            {hand.map((id) => card(id, true))}
            {overflow && (
              <li data-card="more" className="relative z-20 w-(--card)">
                <MoreCard bg={ordered[hand.length]} label={`+${hidden}`} hint="Show all" onClick={toggle} />
              </li>
            )}
          </ul>
        ) : (
          // Unfolded: every Lad in a plain grid, and a card to fold them back.
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(var(--card),1fr))] gap-3">
            {ordered.map((id) => card(id, false))}
            <li data-card="more" className="relative">
              <MoreCard bg={ordered[0]} label="Fold" hint={`${ordered.length} LADS`} onClick={toggle} />
            </li>
          </ul>
        )}
      </div>
      {lad && data && open !== null && (
        <LadDialog
          lad={lad}
          data={data}
          onClose={close}
          onPrev={index > 0 ? () => setOpen(ordered[index - 1]) : undefined}
          onNext={index >= 0 && index < ordered.length - 1 ? () => setOpen(ordered[index + 1]) : undefined}
          action={
            open === photo ? (
              <p className="rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-muted ring-1 ring-line">This LAD is your passport photo.</p>
            ) : (
              <button
                type="button"
                onClick={() => onPhoto(open)}
                className="rounded-[4px] bg-accent px-5 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-ink"
              >
                Use as passport photo
              </button>
            )
          }
        />
      )}
    </>
  );
}

// The "+X" card that unfolds the hand (and the "Fold" card that closes it), same size as a Lad.
// Behind the label: the next hidden Lad, blurred, under a dark veil that turns red on hover.
function MoreCard({ bg, label, hint, onClick }: { bg: number; label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-ink text-white shadow-[-10px_0_18px_-10px_rgba(17,17,17,0.45)] transition-transform duration-300 ease-out hover:-translate-y-1"
    >
      <Image src={thumbImage(bg)} alt="" fill sizes="140px" quality={70} className="scale-125 object-cover blur-[6px]" />
      <span className="absolute inset-0 bg-ink/55 transition-colors duration-300 group-hover:bg-accent/85" aria-hidden />
      <span className="relative text-[clamp(1.5rem,2.6vw,2rem)] leading-none font-bold tracking-[-0.04em] tabular-nums">{label}</span>
      <span className="relative text-xs font-semibold text-white/80 group-hover:text-white">{hint}</span>
    </button>
  );
}

/* Each card glides from the hand to the grid (and back): every card gets its own
   view-transition-name for the switch, removed right after. Without the API, or with
   reduced motion, the layout just switches. */
type VTDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
function unfold(root: HTMLElement | null, update: () => void) {
  const doc = document as VTDocument;
  if (!root || !doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  const name = (on: boolean) =>
    root.querySelectorAll<HTMLElement>("[data-card]").forEach((el) => {
      el.style.viewTransitionName = on ? `hl-${el.dataset.card}` : "";
      el.style.setProperty("view-transition-class", on ? "hl-card" : ""); // timing in bag.css
    });
  name(true);
  const t = doc.startViewTransition(() => {
    flushSync(update);
    name(true);
  });
  t.finished.finally(() => name(false));
}
