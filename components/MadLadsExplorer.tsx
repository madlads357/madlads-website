"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { loadCollection, originalImage, thumbImage, type Collection } from "@/lib/madlads";
import { CloseIcon, SearchIcon } from "./Icons";

const PAGE = 60;
const PROMO_AT = 10; // in-grid promo card position (default view only)
type Selected = Record<number, Set<number>>; // trait index -> selected value indexes
type Sort = "asc" | "desc";
type Density = "comfy" | "compact";

/* Background swatches — sampled from the artwork itself. */
const SWATCH: Record<string, string> = {
  Red: "#f74f5f",
  Pink: "#e998a6",
  Orange: "#e8ad9d",
  Yellow: "#e5d1b1",
  White: "#e2ddd5",
  Green: "#90cec8",
  Blue: "#67bcef",
  Violet: "#97a5e9",
  Purple: "#c8a1e9",
  Grey: "#738ca8",
  "Royal Rug": "linear-gradient(135deg,#734440,#c9963f)",
  "Miami Vice": "linear-gradient(135deg,#e85b9a,#3bb6c4)",
  "American Summer": "linear-gradient(135deg,#2b3a53,#c4303b)",
};

/* Quick groups shown as pills above the grid. */
export const ONE_OF_ONE_TYPES = ["King", "Oracle", "Glitch", "Mother", "Cowgirl"];
type Quick = "all" | "lads" | "lassies" | "skulls" | "oneofones";
const QUICK: { key: Quick; label: string }[] = [
  { key: "all", label: "All" },
  { key: "lads", label: "Lads" },
  { key: "lassies", label: "Lassies" },
  { key: "skulls", label: "Skulls" },
  { key: "oneofones", label: "1/1s" },
];

const fmt = (n: number) => n.toLocaleString("en-US");

/* Card → detail morph with the View Transitions API. The clicked tile and the dialog image
   share the name "lad-hero" (never both at once), so the browser animates one into the other.
   Browsers without the API, and reduced motion, just open/close instantly. */
type VTDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } };
const HERO = "lad-hero";
let namedTile: HTMLElement | null = null; // tile still carrying the name from the last close
export function morph(update: () => void, before?: HTMLElement | null, after?: () => HTMLElement | null) {
  const doc = document as VTDocument;
  if (namedTile) namedTile.style.viewTransitionName = ""; // two elements with one name would cancel the morph
  namedTile = null;
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  if (before) before.style.viewTransitionName = HERO;
  const t = doc.startViewTransition(() => {
    if (before) before.style.viewTransitionName = "";
    flushSync(update);
    namedTile = after?.() ?? null;
    if (namedTile) namedTile.style.viewTransitionName = HERO;
  });
  t.finished.finally(() => {
    if (namedTile) namedTile.style.viewTransitionName = "";
    namedTile = null;
  });
}
export const inView = (el: Element | null) => {
  const r = el?.getBoundingClientRect();
  return r && r.bottom > 0 && r.top < window.innerHeight ? (el as HTMLElement) : null;
};
const PLACEHOLDER: number[][] = Array.from({ length: 20 }, (_, i) => [i + 1]);

/* ------------------------------------------------------------ URL sync */
function readUrl(c: Collection) {
  const p = new URLSearchParams(window.location.search);
  const selected: Selected = {};
  c.traits.forEach((t, ti) => {
    const vals = p.getAll(t.name.toLowerCase()).map((v) => t.values.indexOf(v)).filter((i) => i >= 0);
    if (vals.length) selected[ti] = new Set(vals);
  });
  const id = Number(p.get("id"));
  const quick = (QUICK.find((x) => x.key === p.get("group"))?.key ?? "all") as Quick;
  return {
    q: p.get("q") ?? "",
    sort: (p.get("sort") === "desc" ? "desc" : "asc") as Sort,
    selected,
    quick,
    open: Number.isFinite(id) && id > 0 ? id : null,
  };
}

function writeUrl(c: Collection, s: { q: string; sort: Sort; selected: Selected; quick: Quick; open: number | null }) {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.quick !== "all") p.set("group", s.quick);
  if (s.sort !== "asc") p.set("sort", s.sort);
  Object.entries(s.selected).forEach(([ti, set]) =>
    set.forEach((vi) => p.append(c.traits[+ti].name.toLowerCase(), c.traits[+ti].values[vi])),
  );
  if (s.open) p.set("id", String(s.open));
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

/* ------------------------------------------------------------ Explorer */
export function MadLadsExplorer() {
  const [data, setData] = useState<Collection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("asc");
  const [selected, setSelected] = useState<Selected>({});
  const [quick, setQuick] = useState<Quick>("all");
  const [open, setOpen] = useState<number | null>(null);
  const [limit, setLimit] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [density, setDensity] = useState<Density>("comfy");
  const ready = useRef(false);

  useEffect(() => {
    loadCollection()
      .then((c) => {
        const s = readUrl(c);
        setQ(s.q);
        setSort(s.sort);
        setSelected(s.selected);
        setQuick(s.quick);
        setOpen(s.open);
        setData(c);
        ready.current = true;
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (data && ready.current) writeUrl(data, { q, sort, selected, quick, open });
  }, [data, q, sort, selected, quick, open]);

  useEffect(() => setLimit(PAGE), [q, sort, selected, quick]);

  const typeIdx = data ? data.traits.findIndex((t) => t.name === "Type") : -1;
  const genderIdx = data ? data.traits.findIndex((t) => t.name === "Gender") : -1;

  const inQuick = useCallback(
    (lad: number[], group: Quick) => {
      if (!data || group === "all") return true;
      const type = data.traits[typeIdx].values[lad[typeIdx + 1]];
      const gender = data.traits[genderIdx].values[lad[genderIdx + 1]];
      if (group === "skulls") return type === "Skull";
      if (group === "oneofones") return ONE_OF_ONE_TYPES.includes(type);
      const regular = type !== "Skull" && !ONE_OF_ONE_TYPES.includes(type);
      return regular && gender === (group === "lads" ? "Male" : "Female");
    },
    [data, typeIdx, genderIdx],
  );

  const digits = q.replace(/\D/g, "");

  // Does a Lad pass every filter? `skipTrait` / `skipQuick` leave one out, for facet counts.
  const passes = useCallback(
    (lad: number[], skipTrait = -1, skipQuick = false) => {
      if (digits && !String(lad[0]).includes(digits)) return false;
      if (!skipQuick && !inQuick(lad, quick)) return false;
      for (const key in selected) {
        const ti = +key;
        if (ti !== skipTrait && !selected[ti].has(lad[ti + 1])) return false;
      }
      return true;
    },
    [digits, selected, quick, inQuick],
  );

  const results = useMemo(() => {
    if (!data) return [];
    const r = data.lads.filter((l) => passes(l));
    if (digits) r.sort((a, b) => Number(b[0] === +digits) - Number(a[0] === +digits) || a[0] - b[0]);
    else if (sort === "desc") r.reverse();
    return r;
  }, [data, passes, digits, sort]);

  const counts = useMemo(() => {
    if (!data) return [];
    return data.traits.map((t, ti) => {
      const c = new Array<number>(t.values.length).fill(0);
      for (const l of data.lads) if (l[ti + 1] >= 0 && passes(l, ti)) c[l[ti + 1]]++;
      return c;
    });
  }, [data, passes]);

  const quickCounts = useMemo(() => {
    const c: Record<Quick, number> = { all: 0, lads: 0, lassies: 0, skulls: 0, oneofones: 0 };
    if (!data) return c;
    for (const l of data.lads) {
      if (!passes(l, -1, true)) continue;
      for (const { key } of QUICK) if (inQuick(l, key)) c[key]++;
    }
    return c;
  }, [data, passes, inQuick]);

  const toggle = (ti: number, vi: number) =>
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[ti] ?? []);
      if (set.has(vi)) set.delete(vi);
      else set.add(vi);
      if (set.size) next[ti] = set;
      else delete next[ti];
      return next;
    });

  const clearAll = () => {
    setSelected({});
    setQuick("all");
    setQ("");
  };
  const activeCount = Object.values(selected).reduce((n, s) => n + s.size, 0);

  // Infinite scroll
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && setLimit((l) => l + PAGE), { rootMargin: "1200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [data]);

  if (error) return <p className="py-20 text-center text-muted">{error}</p>;

  // Before the metadata arrives, the very same layout renders with Lads #1–20 (the default
  // order), so the static HTML already shows them and React keeps those tiles on hydration.
  const items = data ? results : PLACEHOLDER;

  const openIndex = open ? results.findIndex((l) => l[0] === open) : -1;
  const openLad = open ? (openIndex >= 0 ? results[openIndex] : data?.lads.find((l) => l[0] === open)) : undefined;
  const openLadFrom = (id: number, tile: HTMLElement) => morph(() => setOpen(id), tile);
  const closeLad = () =>
    morph(
      () => setOpen(null),
      null,
      () => inView(document.querySelector(`[data-lad="${open}"]`)),
    );
  const step = (d: number) => {
    if (openIndex < 0) return;
    const next = results[openIndex + d];
    if (next) setOpen(next[0]);
  };

  const panel = data ? (
    <FilterPanel data={data} counts={counts} selected={selected} toggle={toggle} />
  ) : (
    <div aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-[51px] border-b border-line" />
      ))}
    </div>
  );
  const isDefaultView = !digits && quick === "all" && activeCount === 0 && sort === "asc";
  const cols =
    density === "comfy"
      ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
      : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8";

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-[72px] z-30 -mx-4 bg-paper/90 px-4 pt-3 pb-3 backdrop-blur-md md:top-[88px] md:-mx-page md:px-page">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 shadow-[0_1px_0_rgba(17,17,17,0.03),0_8px_24px_-12px_rgba(17,17,17,0.12)]">
          <button
            type="button"
            onClick={() => (window.innerWidth < 1024 ? setDrawer(true) : setShowFilters((s) => !s))}
            aria-expanded={showFilters}
            aria-label={activeCount ? `Filters (${activeCount} active)` : "Filters"}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors hover:bg-sunken"
          >
            <FilterIcon className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-white">{activeCount}</span>}
          </button>
          <span className="h-6 w-px bg-line" aria-hidden />
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 focus-within:bg-sunken/60">
            <SearchIcon className="size-4 shrink-0 text-muted" />
            <span className="sr-only">Find a Mad Lad by number</span>
            <input
              inputMode="numeric"
              placeholder="Search by number…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="rounded-full p-1 hover:bg-sunken">
                <CloseIcon className="size-3.5 text-muted" />
              </button>
            )}
          </label>
          <p className="hidden shrink-0 px-2 text-sm text-muted md:block" aria-live="polite">
            <span className="font-semibold text-ink tabular-nums">{data ? fmt(results.length) : "9,971"}</span> {data && results.length === 1 ? "Lad" : "Lads"}
          </p>
          <SortMenu sort={sort} setSort={setSort} />
          <div className="hidden shrink-0 rounded-xl bg-sunken p-1 sm:flex" role="group" aria-label="Grid density">
            {(["comfy", "compact"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                aria-pressed={density === d}
                aria-label={d === "comfy" ? "Large tiles" : "Small tiles"}
                className={`grid size-8 place-items-center rounded-lg transition-colors ${density === d ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}
              >
                {d === "comfy" ? <GridLargeIcon className="size-4" /> : <GridSmallIcon className="size-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Quick groups + active filters */}
        <div className="no-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
          {QUICK.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setQuick(key)}
              aria-pressed={quick === key}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                quick === key ? "bg-ink text-white" : "bg-surface text-ink ring-1 ring-line hover:ring-ink"
              }`}
            >
              {label}
              <span className={`text-xs tabular-nums ${quick === key ? "text-white/60" : "text-muted"}`}>{data ? fmt(quickCounts[key]) : ""}</span>
            </button>
          ))}
          {(activeCount > 0 || quick !== "all" || q) && (
            <>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />
              {Object.entries(selected).flatMap(([ti, set]) =>
                [...set].map((vi) => (
                  <button
                    key={`${ti}-${vi}`}
                    type="button"
                    onClick={() => toggle(+ti, vi)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
                  >
                    <span className="opacity-70">{data?.traits[+ti].name}</span> {data?.traits[+ti].values[vi]}
                    <CloseIcon className="size-3" />
                  </button>
                )),
              )}
              <button type="button" onClick={clearAll} className="shrink-0 px-2 text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink">
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`mt-4 grid gap-8 ${showFilters ? "lg:grid-cols-[264px_1fr]" : ""}`}>
        {showFilters && (
          <aside className="hidden lg:block">
            <div className="thin-scroll sticky top-[200px] max-h-[calc(100svh-224px)] overflow-y-auto pr-3">{panel}</div>
          </aside>
        )}

        <div className="min-w-0">
          {data && results.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line py-24 text-center">
              <p className="t-h3">No Mad Lad matches.</p>
              <p className="mt-2 text-muted">Try another number or remove a filter.</p>
              <button type="button" onClick={clearAll} className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">
                Reset filters
              </button>
            </div>
          ) : (
            <ul className={`grid gap-3 md:gap-4 ${cols}`}>
              {items.slice(0, limit).map((l, i) => (
                <Fragment key={l[0]}>
                  {i === PROMO_AT && isDefaultView && (
                    <li className={density === "comfy" ? "col-span-2" : "col-span-3"}>
                      <PromoCard />
                    </li>
                  )}
                  <li>
                    <Tile id={l[0]} label={data?.traits[typeIdx].values[l[typeIdx + 1]]} priority={i < 4} onOpen={(el) => openLadFrom(l[0], el)} compact={density === "compact"} />
                  </li>
                </Fragment>
              ))}
            </ul>
          )}
          <div ref={sentinel} className="h-10" />
          {limit < results.length && <p className="pb-10 text-center text-sm text-muted">Loading more Lads…</p>}
        </div>
      </div>

      {/* Mobile filters: bottom sheet (drag the handle down, tap outside or Esc to close) */}
      {drawer && (
        <FilterSheet onClose={() => setDrawer(false)} onReset={clearAll} total={results.length} active={activeCount}>
          {panel}
        </FilterSheet>
      )}

      {openLad && data && (
        <LadDialog
          lad={openLad}
          data={data}
          onClose={closeLad}
          onPrev={openIndex > 0 ? () => step(-1) : undefined}
          onNext={openIndex >= 0 && openIndex < results.length - 1 ? () => step(1) : undefined}
          onFilter={(ti, vi) => {
            setSelected({ [ti]: new Set([vi]) });
            setQuick("all");
            setQ("");
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Tile */
// Thumbnail: Tensor's 400×500 render, re-encoded by next/image to a small AVIF/WebP
// sized to the tile. Falls back to the S3 original if the CDN is unavailable.
function Thumb({ id, priority, sizes }: { id: number; priority?: boolean; sizes?: string }) {
  const [src, setSrc] = useState(thumbImage(id));
  return (
    <Image
      src={src}
      alt={`Mad Lad #${id}`}
      fill
      sizes={sizes ?? "(min-width: 1536px) 18vw, (min-width: 1280px) 22vw, (min-width: 640px) 30vw, 48vw"}
      quality={70}
      loading={priority ? "eager" : undefined}
      fetchPriority={priority ? "high" : undefined}
      onError={() => src !== originalImage(id) && setSrc(originalImage(id))}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
    />
  );
}

export function Tile({ id, label, priority, onOpen, compact }: { id: number; label?: string; priority?: boolean; onOpen?: (el: HTMLElement) => void; compact?: boolean }) {
  const body = (
    <>
      <Thumb id={id} priority={priority} sizes={compact ? "(min-width: 1536px) 12vw, (min-width: 1024px) 16vw, 30vw" : undefined} />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span className={`absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/90 font-semibold text-ink shadow-sm backdrop-blur ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}>
        #{id}
      </span>
      {label && (label === "Skull" || ONE_OF_ONE_TYPES.includes(label)) ? (
        <span className={`absolute top-2 right-2 rounded-full bg-ink/80 font-semibold tracking-wide text-white uppercase backdrop-blur ${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"}`}>
          {label === "Skull" ? "Skull" : "1/1"}
        </span>
      ) : null}
    </>
  );
  const cls =
    "group relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-sunken text-left ring-1 ring-black/5 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(17,17,17,0.45)] focus-visible:-translate-y-1";
  return onOpen ? (
    <button type="button" data-lad={id} onClick={(e) => onOpen(e.currentTarget)} className={cls} aria-label={`Open Mad Lad #${id}`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------------------------------------ Promo card */
// Breaks up the long grid in the default view (idea from scrolltide.co's in-grid cards).
function PromoCard() {
  return (
    <Link
      href="/lore"
      className="group relative isolate flex h-full min-h-[240px] flex-col justify-end overflow-hidden rounded-xl bg-ink p-5 text-white ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(17,17,17,0.6)] md:p-7"
    >
      <Image
        src={originalImage(8420)}
        alt=""
        fill
        sizes="(min-width: 1280px) 40vw, 66vw"
        className="-z-10 object-cover object-[50%_30%] opacity-60 transition-transform duration-700 group-hover:scale-105"
      />
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <span className="t-eyebrow text-white/70">The Lore</span>
      <span className="mt-2 text-2xl leading-tight font-bold tracking-tight md:text-3xl">From the mint to the Mad King.</span>
      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">
        Read the story <span className="transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}

/* ------------------------------------------------------------ Sort menu */
function SortMenu({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const options: { key: Sort; label: string }[] = [
    { key: "asc", label: "Number: low to high" },
    { key: "desc", label: "Number: high to low" },
  ];
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort: ${sort === "asc" ? "number low to high" : "number high to low"}`}
        className="flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors hover:bg-sunken"
      >
        <SortIcon className="size-4" />
        <span className="hidden md:inline">{sort === "asc" ? "#1 → #9,971" : "#9,971 → #1"}</span>
        <Chevron className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 z-40 mt-2 w-56 origin-top-right animate-[pop_160ms_ease-out] rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          {options.map((o) => (
            <li key={o.key}>
              <button
                type="button"
                role="option"
                aria-selected={sort === o.key}
                onClick={() => {
                  setSort(o.key);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-sunken ${sort === o.key ? "font-semibold" : ""}`}
              >
                {o.label}
                {sort === o.key && <Check className="size-4 text-accent" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Filters */
const DEFAULT_OPEN = new Set(["Type", "Gender", "Background"]);
const LONG_LIST = 10;
const PREVIEW = 8;

function FilterPanel({
  data,
  counts,
  selected,
  toggle,
}: {
  data: Collection;
  counts: number[][];
  selected: Selected;
  toggle: (ti: number, vi: number) => void;
}) {
  return (
    <div className="flex flex-col">
      {data.traits.map((t, ti) => (
        <FilterGroup key={t.name} name={t.name} defaultOpen={DEFAULT_OPEN.has(t.name) || (selected[ti]?.size ?? 0) > 0} count={selected[ti]?.size ?? 0}>
          {t.name === "Background" ? (
            <div className="grid grid-cols-2 gap-1.5">
              {t.values.map((v, vi) => (
                <Swatch key={v} label={v} color={SWATCH[v] ?? "#ccc"} count={counts[ti][vi]} on={selected[ti]?.has(vi) ?? false} onClick={() => toggle(ti, vi)} />
              ))}
            </div>
          ) : t.values.length <= LONG_LIST ? (
            <div className="flex flex-wrap gap-1.5">
              {t.values.map((v, vi) => (
                <Chip key={v} label={v} count={counts[ti][vi]} on={selected[ti]?.has(vi) ?? false} onClick={() => toggle(ti, vi)} />
              ))}
            </div>
          ) : (
            <LongList values={t.values} counts={counts[ti]} selected={selected[ti]} onToggle={(vi) => toggle(ti, vi)} name={t.name} />
          )}
        </FilterGroup>
      ))}
    </div>
  );
}

function FilterGroup({ name, count, defaultOpen, children }: { name: string; count: number; defaultOpen: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (count > 0) setOpen(true);
  }, [count]);
  return (
    <section className="border-b border-line last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-3.5 text-left">
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          {name}
          {count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] text-white">{count}</span>}
        </span>
        <Chevron className={`size-4 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Chip({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={!count && !on}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-all disabled:opacity-35 ${
        on ? "bg-ink text-white" : "bg-surface ring-1 ring-line hover:ring-ink"
      }`}
    >
      {label}
      <span className={`text-[11px] tabular-nums ${on ? "text-white/60" : "text-muted"}`}>{fmt(count)}</span>
    </button>
  );
}

function Swatch({ label, color, count, on, onClick }: { label: string; color: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      disabled={!count && !on}
      className={`flex items-center gap-2 rounded-xl p-1.5 pr-2.5 text-left text-[13px] transition-all disabled:opacity-35 ${
        on ? "bg-ink text-white" : "bg-surface ring-1 ring-line hover:ring-ink"
      }`}
    >
      <span className="size-6 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: color }} aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      <span className={`text-[11px] tabular-nums ${on ? "text-white/60" : "text-muted"}`}>{fmt(count)}</span>
    </button>
  );
}

function LongList({
  name,
  values,
  counts,
  selected,
  onToggle,
}: {
  name: string;
  values: string[];
  counts: number[];
  selected?: Set<number>;
  onToggle: (vi: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const items = values
    .map((v, vi) => ({ v, vi }))
    .filter(({ v }) => v.toLowerCase().includes(query.toLowerCase()));
  const shown = all || query ? items : items.slice(0, PREVIEW);
  return (
    <div>
      <label className="mb-2 flex h-9 items-center gap-2 rounded-lg bg-sunken/70 px-3">
        <SearchIcon className="size-3.5 text-muted" />
        <span className="sr-only">Search {name}</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${values.length} ${name.toLowerCase()}…`} className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted" />
      </label>
      <ul className="flex flex-col">
        {shown.map(({ v, vi }) => {
          const on = selected?.has(vi) ?? false;
          const c = counts[vi];
          return (
            <li key={v}>
              <button
                type="button"
                onClick={() => onToggle(vi)}
                aria-pressed={on}
                disabled={!c && !on}
                className="group/row flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-sunken disabled:opacity-35"
              >
                <span className={`grid size-4 shrink-0 place-items-center rounded-[5px] border-[1.5px] transition-colors ${on ? "border-ink bg-ink text-white" : "border-line group-hover/row:border-ink"}`}>
                  {on && <Check className="size-3" />}
                </span>
                <span className="flex-1 truncate">{v}</span>
                <span className="text-[11px] text-muted tabular-nums">{fmt(c)}</span>
              </button>
            </li>
          );
        })}
        {!shown.length && <li className="px-2 py-2 text-[13px] text-muted">No match.</li>}
      </ul>
      {!query && items.length > PREVIEW && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-1 px-2 text-[13px] font-semibold text-accent hover:underline">
          {all ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Filter sheet (mobile) */
function FilterSheet({ children, onClose, onReset, total, active }: { children: ReactNode; onClose: () => void; onReset: () => void; total: number; active: number }) {
  const sheet = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; dy: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const setY = (y: number, animate: boolean) => {
    const el = sheet.current;
    if (!el) return;
    el.style.transition = animate ? "transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1)" : "none";
    el.style.transform = y ? `translateY(${y}px)` : "";
  };
  const down = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, e.clientY - drag.current.y);
    setY(drag.current.dy, false);
  };
  const up = () => {
    const dy = drag.current?.dy ?? 0;
    drag.current = null;
    if (dy > 110) {
      setY(window.innerHeight, true);
      setTimeout(onClose, 200);
    } else setY(0, true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" className="absolute inset-0 animate-[fade-in_200ms_ease-out] bg-black/40 backdrop-blur-sm" aria-label="Close filters" onClick={onClose} />
      <div
        ref={sheet}
        data-lenis-prevent
        className="relative flex max-h-[86svh] animate-[sheet-up_320ms_cubic-bezier(0.2,0.7,0.2,1)] flex-col rounded-t-3xl bg-paper shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.4)]"
      >
        {/* Drag handle + header */}
        <div className="cursor-grab touch-none px-5 pt-3 pb-3 select-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <span className="mx-auto block h-1.5 w-11 rounded-full bg-line" aria-hidden />
          <div className="mt-3 flex items-center justify-between">
            <p className="t-h3">
              Filters {active > 0 && <span className="ml-1 align-middle text-sm font-semibold text-accent">{active} active</span>}
            </p>
            <button type="button" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="Close filters" className="grid size-10 place-items-center rounded-full hover:bg-sunken">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">{children}</div>
        <div className="flex gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button type="button" onClick={onReset} className="h-12 flex-1 rounded-xl border-[1.5px] border-ink font-semibold">
            Reset
          </button>
          <button type="button" onClick={onClose} className="h-12 flex-[1.4] rounded-xl bg-accent font-semibold text-white">
            Show {fmt(total)} Lads
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Detail */
export function LadDialog({
  lad,
  data,
  onClose,
  onPrev,
  onNext,
  onFilter,
  action,
}: {
  lad: number[];
  data: Collection;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFilter?: (ti: number, vi: number) => void; // without it, traits are shown but not clickable
  action?: ReactNode; // an extra button above the tip (e.g. "Use as passport photo" in the holder area)
}) {
  const id = lad[0];
  const [full, setFull] = useState(false);
  const swipeX = useRef<number | null>(null); // touch: swipe the picture left/right to browse
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(dialog);
  useEffect(() => setFull(false), [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const total = data.lads.length;
  const share = useMemo(
    () =>
      data.traits.map((_, ti) => {
        const vi = lad[ti + 1];
        if (vi < 0) return 0;
        let n = 0;
        for (const l of data.lads) if (l[ti + 1] === vi) n++;
        return n;
      }),
    [data, lad],
  );

  return (
    <div ref={dialog} className="fixed inset-0 z-[80] grid place-items-center p-3 md:p-6" role="dialog" aria-modal="true" aria-label={`Mad Lad #${id}`}>
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative grid max-h-[94svh] w-full max-w-5xl animate-[pop_200ms_ease-out] overflow-y-auto rounded-2xl bg-paper shadow-2xl md:grid-cols-[1.05fr_1fr] md:overflow-hidden">
        <div
          className="relative aspect-[4/5] touch-pan-y bg-sunken"
          style={{ viewTransitionName: HERO }}
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse") swipeX.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (swipeX.current === null) return;
            const dx = e.clientX - swipeX.current;
            swipeX.current = null;
            if (dx > 50) onPrev?.();
            if (dx < -50) onNext?.();
          }}
          onPointerCancel={() => (swipeX.current = null)}
        >
          <Thumb id={id} sizes="(min-width: 768px) 50vw, 100vw" />
          {/* Plain <img>: the 5 MB original fades in over the optimized thumbnail. */}
          <img
            key={id}
            src={originalImage(id)}
            alt={`Mad Lad #${id}`}
            onLoad={() => setFull(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${full ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-x-3 bottom-3 flex justify-between md:inset-x-4 md:bottom-4">
            <NavButton label="Previous Lad" onClick={onPrev} dir="left" />
            <NavButton label="Next Lad" onClick={onNext} dir="right" />
          </div>
        </div>
        <div className="thin-scroll flex flex-col gap-6 p-6 md:overflow-y-auto md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-eyebrow text-accent">Mad Lads</p>
              <h2 className="t-h2 mt-2 tabular-nums">#{id}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" data-autofocus className="grid size-10 place-items-center rounded-full bg-surface ring-1 ring-line hover:ring-ink">
              <CloseIcon className="size-5" />
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-2">
            {data.traits.map((t, ti) => {
              const vi = lad[ti + 1];
              if (vi < 0) return null;
              const pct = (share[ti] / total) * 100;
              return (
                <div key={t.name}>
                  <TraitCard onClick={onFilter && (() => onFilter(ti, vi))} title={`See every Lad with ${t.name}: ${t.values[vi]}`}>
                    <dt className="t-eyebrow text-muted">{t.name}</dt>
                    <dd className="font-semibold leading-tight">{t.values[vi]}</dd>
                    <dd className="mt-auto pt-1">
                      <span className="block h-1 overflow-hidden rounded-full bg-sunken">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">{share[ti] === 1 ? "1 of 1" : `${fmt(share[ti])} Lads · ${pct.toFixed(pct < 1 ? 2 : 1)}%`}</span>
                    </dd>
                  </TraitCard>
                </div>
              );
            })}
          </dl>
          {action}
          <p className="text-xs text-muted">
            {/* keyboard tip on computers, touch tip on phones and tablets */}
            <span className="pointer-coarse:hidden">Tip: use ← → to browse, Esc to close.{onFilter && " Click a trait to see every Lad that has it."}</span>
            <span className="hidden pointer-coarse:inline">Tip: swipe the picture to browse, tap outside to close.{onFilter && " Tap a trait to see every Lad that has it."}</span>
          </p>
          <a href={originalImage(id)} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-accent underline underline-offset-4">
            Open full-resolution image ↗
          </a>
        </div>
      </div>
    </div>
  );
}

// A trait in the dialog: a button that filters the grid, or a plain card when there's no grid to filter.
function TraitCard({ onClick, title, children }: { onClick?: () => void; title: string; children: ReactNode }) {
  const cls = "flex h-full w-full flex-col gap-1 rounded-xl bg-surface p-3 text-left ring-1 ring-line";
  return onClick ? (
    <button type="button" onClick={onClick} title={title} className={`${cls} transition-all hover:-translate-y-0.5 hover:ring-ink`}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

function NavButton({ label, onClick, dir }: { label: string; onClick?: () => void; dir: "left" | "right" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full bg-white/90 text-ink shadow-lg backdrop-blur transition-all hover:scale-105 disabled:opacity-0"
    >
      <Chevron className={`size-5 ${dir === "left" ? "rotate-90" : "-rotate-90"}`} />
    </button>
  );
}

/* ------------------------------------------------------------ Small icons */
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24", "aria-hidden": true };
const FilterIcon = ({ className }: { className?: string }) => (
  <svg {...stroke} className={className}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
const SortIcon = ({ className }: { className?: string }) => (
  <svg {...stroke} className={className}>
    <path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" />
  </svg>
);
const Chevron = ({ className }: { className?: string }) => (
  <svg {...stroke} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
const Check = ({ className }: { className?: string }) => (
  <svg {...stroke} strokeWidth={3} className={className}>
    <path d="M5 12.5 10 17l9-10" />
  </svg>
);
const GridLargeIcon = ({ className }: { className?: string }) => (
  <svg {...stroke} className={className}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
const GridSmallIcon = ({ className }: { className?: string }) => (
  <svg {...stroke} className={className}>
    <path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" />
  </svg>
);
