"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { thumbImage } from "@/lib/madlads";
import { useDialogFocus } from "@/lib/useDialogFocus";
import type { MyPin } from "@/lib/db";

type City = { city: string; country: string; region: string; lat: number; lng: number };

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export const countryName = (cc: string) => {
  try {
    return regionNames?.of(cc) ?? cc;
  } catch {
    return cc;
  }
};

// "Put me on the map": pick a city, choose whether the pin shows the holder's name and Lad, save.
// The same dialog edits an existing pin (and can remove it).
export function PinDialog({ mine, lad, onClose, onChanged }: { mine: MyPin | null; lad: number | null; onClose: () => void; onChanged: (pin: MyPin | null) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [query, setQuery] = useState(mine ? mine.city : "");
  const [picked, setPicked] = useState<City | null>(mine ? { city: mine.city, country: mine.country, region: "", lat: mine.lat, lng: mine.lng } : null);
  const [results, setResults] = useState<City[]>([]);
  const [active, setActive] = useState(0);
  const [showIdentity, setShowIdentity] = useState(mine?.showIdentity ?? false); // private by default: showing yourself is a choice
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useDialogFocus(root);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Search as the holder types (a short pause first), never for the city that is already picked.
  useEffect(() => {
    const q = query.trim();
    if (picked || q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/holder/cities?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { cities: [] }))
        .then((d: { cities: City[] }) => {
          setResults(d.cities);
          setActive(0);
        })
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, picked]);

  const pick = (c: City) => {
    setPicked(c);
    setQuery(`${c.city}, ${countryName(c.country)}`);
    setResults([]);
    setError("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[active]);
    }
  };

  async function save() {
    if (!picked || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/holder/map", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: picked.city, country: picked.country, lat: picked.lat, lng: picked.lng, showIdentity }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn’t save your pin.");
      onChanged({ city: picked.city, country: picked.country, lat: picked.lat, lng: picked.lng, showIdentity });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/holder/map", { method: "DELETE" });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn’t remove your pin.");
      onChanged(null);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div ref={root} className="fixed inset-0 z-[80] grid place-items-end md:place-items-center" role="dialog" aria-modal="true" aria-labelledby={`${listId}-title`} data-lenis-prevent>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-ink/55" />
      <div className="relative max-h-[92svh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl md:max-w-[640px] md:rounded-[8px] md:p-10">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full text-2xl leading-none text-muted transition hover:text-ink md:top-6 md:right-6">
          <span aria-hidden>×</span>
        </button>

        <h2 id={`${listId}-title`} className="pr-10 text-[clamp(1.5rem,3vw,2rem)] leading-tight font-bold tracking-[-0.03em]">
          {mine ? "Move your pin" : "Pin your Lad on the map"}
        </h2>
        <p className="mt-2 text-muted">Choose your city. Other holders will see where you are, never more than the city.</p>

        <div className="mt-7 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-8">
          {/* What the pin will look like */}
          <div className="mx-auto md:mx-0" aria-hidden>
            <div className="relative size-28 rounded-full border-[5px] border-white bg-sunken shadow-[0_2px_12px_rgb(17_17_17/0.25)] md:size-32">
              {showIdentity && lad ? (
                <Image src={thumbImage(lad)} alt="" fill sizes="128px" quality={70} className="rounded-full object-cover object-[50%_20%]" />
              ) : (
                <span className="absolute inset-0 m-auto size-6 rounded-full border-[3px] border-white bg-red" />
              )}
              <span className="absolute -bottom-3.5 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[14px] border-x-transparent border-t-red" />
            </div>
          </div>

          <div className="relative">
            <label htmlFor={`${listId}-city`} className="text-sm font-semibold">
              City
            </label>
            <input
              id={`${listId}-city`}
              data-autofocus
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={results.length ? `${listId}-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPicked(null);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search a city (e.g. Amsterdam)"
              className="mt-1.5 w-full rounded-[4px] border border-line bg-surface px-4 py-3.5 text-[16px] outline-offset-2 focus:border-ink focus-visible:outline-2 focus-visible:outline-accent"
            />
            {results.length > 0 && (
              <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-[4px] border border-line bg-surface shadow-lg">
                {results.map((c, i) => (
                  <li key={`${c.city}${c.country}${c.lat}${c.lng}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(c)}
                      className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left ${i === active ? "bg-red/10" : ""}`}
                    >
                      <span>
                        <span className={i === active ? "font-semibold text-accent" : "font-semibold"}>{c.city}</span>
                        <span className="text-muted">, {countryName(c.country)}</span>
                      </span>
                      {c.region && c.region !== c.city && <span className="shrink-0 text-sm text-muted">{c.region}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!picked && query.trim().length >= 2 && results.length === 0 && <p className="mt-2 text-sm text-muted">Keep typing, then pick a city from the list. Smaller towns: pick the nearest city.</p>}
          </div>
        </div>

        <div className="mt-7 flex items-start justify-between gap-5 border-t border-line pt-6">
          <div>
            <p id={`${listId}-toggle`} className="font-semibold">
              Show my name and Lad to other holders
            </p>
            <p className="mt-1 text-sm text-muted">
              {showIdentity ? "Your name and Lad appear on your pin." : "You stay a red dot: you count on the map, but nobody sees who you are."} City-level only. Only holders can see
              this. Remove it any time.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={showIdentity}
            aria-labelledby={`${listId}-toggle`}
            onClick={() => setShowIdentity((v) => !v)}
            className={`relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition-colors outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent ${showIdentity ? "bg-accent" : "bg-line"}`}
          >
            <span className={`absolute top-1 left-1 size-6 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${showIdentity ? "translate-x-6" : ""}`} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
            {error}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!picked || busy}
            className="rounded-[4px] bg-accent px-6 py-4 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
          >
            {busy ? "Saving…" : "Save pin"}
          </button>
          <button type="button" onClick={onClose} className="rounded-[4px] border-[1.5px] border-line bg-paper px-6 py-4 text-[15px] leading-none font-semibold transition-colors hover:border-ink">
            Cancel
          </button>
          {mine && (
            <button type="button" onClick={remove} disabled={busy} className="mt-1 self-center text-sm text-muted underline underline-offset-4 transition hover:text-ink disabled:opacity-50">
              Remove my pin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
