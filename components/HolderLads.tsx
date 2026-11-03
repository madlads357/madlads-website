"use client";

import { useEffect, useState } from "react";
import { LadDialog, Tile, inView, morph } from "@/components/MadLadsExplorer";
import { loadCollection, type Collection } from "@/lib/madlads";

// The holder's own Lads. Clicking one opens the same detail pop-up as the explorer
// (morph, traits, rarity), and ← → browse only this holder's Lads.
export function HolderLads({ ids }: { ids: number[] }) {
  const [data, setData] = useState<Collection | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    loadCollection().then(setData, () => setData(null));
  }, []);

  const index = open === null ? -1 : ids.indexOf(open);
  const lad = open === null ? undefined : data?.lads.find((l) => l[0] === open);
  const typeIdx = data ? data.traits.findIndex((t) => t.name === "Type") : -1;

  const openFrom = (id: number, tile: HTMLElement) => morph(() => setOpen(id), tile);
  const close = () =>
    morph(
      () => setOpen(null),
      null,
      () => inView(document.querySelector(`[data-lad="${open}"]`)),
    );

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {ids.map((id, i) => {
          const row = data?.lads.find((l) => l[0] === id);
          return (
            <li key={id}>
              <Tile id={id} priority={i < 5} label={row && typeIdx >= 0 ? data!.traits[typeIdx].values[row[typeIdx + 1]] : undefined} onOpen={(el) => openFrom(id, el)} />
            </li>
          );
        })}
      </ul>
      {lad && data && (
        <LadDialog
          lad={lad}
          data={data}
          onClose={close}
          onPrev={index > 0 ? () => setOpen(ids[index - 1]) : undefined}
          onNext={index >= 0 && index < ids.length - 1 ? () => setOpen(ids[index + 1]) : undefined}
        />
      )}
    </>
  );
}
