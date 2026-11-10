"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import "./holder-map.css";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { GeoJSONSource, Map as MapboxMap, Marker, Popup } from "mapbox-gl";
import type { MapCity, MapData, MapPin, MyPin } from "@/lib/db";
import { thumbImage } from "@/lib/madlads";
import { PinDialog, countryName } from "./PinDialog";

type PointFeature = { properties: Record<string, unknown> | null; geometry: { coordinates: number[] } }; // what Mapbox hands back for a point

const PEEK = 156; // px of the bottom sheet that show when it is closed (phones): the handle and the three numbers

const DEFAULT_STYLE = "mapbox://styles/mapbox/light-v11";
const LAND = "#e9dfcb";
const WATER = "#f5efe4";
const BORDER = "#cdbfa6";
const LABEL = "#8b8171";
const CITY_LABEL = "#4d473e";

// The pin's Lad as a small round image (Next's image optimizer, so a 400 px thumbnail never goes to a 48 px circle).
const avatar = (lad: number, w = 96) => `/_next/image?url=${encodeURIComponent(thumbImage(lad))}&w=${w}&q=70`;
const cityKey = (c: MapCity) => `${c.city}|${c.country}|${c.lat}|${c.lng}`; // by place: two cities can share a name (Portland, US)
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n));
const daysSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));

// Holders of one city share its centre, so spread them in a small spiral (a kilometre or two): the pins stay
// readable when you zoom in, and it is still "this city", not a street.
function spread(pins: MapPin[]) {
  const seen = new Map<string, number>();
  return pins.map((p) => {
    const k = `${p.lat},${p.lng}`;
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    const r = 0.012 * Math.sqrt(n);
    const a = n * 2.4;
    return { pin: p, lng: p.lng + (r * Math.cos(a)) / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180)), lat: p.lat + r * Math.sin(a) };
  });
}

function toGeoJSON(pins: MapPin[]) {
  return {
    type: "FeatureCollection" as const,
    features: spread(pins).map(({ pin, lng, lat }) => ({ type: "Feature" as const, properties: { i: pin.id }, geometry: { type: "Point" as const, coordinates: [lng, lat] } })),
  };
}

// The default style is grey and busy. Recolour it to the site (cream land, lighter sea), and keep only the
// borders and the country and ocean names. A custom Mapbox Studio style (MAPBOX_STYLE) is used as it is.
function tint(map: MapboxMap) {
  for (const l of map.getStyle().layers ?? []) {
    try {
      if (l.type === "background") map.setPaintProperty(l.id, "background-color", LAND);
      else if (l.type === "fill") map.setPaintProperty(l.id, "fill-color", /water/.test(l.id) ? WATER : LAND);
      else if (l.type === "line") {
        if (/^admin-0-boundary$/.test(l.id)) {
          map.setPaintProperty(l.id, "line-color", BORDER);
          map.setPaintProperty(l.id, "line-width", 0.8);
        } else map.setLayoutProperty(l.id, "visibility", "none");
      } else if (l.type === "symbol") {
        if (/settlement-(major|minor|subdivision)-label/.test(l.id)) {
          // City, town and neighbourhood names: what tells you where you are when you zoom in. Darker than the country names, with a halo in the land colour.
          map.setPaintProperty(l.id, "text-color", CITY_LABEL);
          map.setPaintProperty(l.id, "text-halo-color", LAND);
          map.setPaintProperty(l.id, "text-halo-width", 1.4);
        } else if (/country-label|continent-label|state-label|ocean|sea-label|water-point-label/.test(l.id)) {
          map.setPaintProperty(l.id, "text-color", LABEL);
          map.setPaintProperty(l.id, "text-halo-width", 0);
          map.setLayoutProperty(l.id, "text-letter-spacing", 0.12);
        } else map.setLayoutProperty(l.id, "visibility", "none");
      } else map.setLayoutProperty(l.id, "visibility", "none");
    } catch {
      /* a layer that doesn't take that property: leave it as it is */
    }
  }
}

export type HolderMapProps = {
  token: string | null;
  style: string | null;
  data: MapData;
  mine: MyPin | null;
  lad: number | null; // the Lad on the holder's own pin preview
  canSave: boolean; // false without a database
};

export function HolderMap({ token, style, data, mine, lad, canSave }: HolderMapProps) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const resetMarkers = useRef<() => void>(() => {});
  const pinsRef = useRef(new Map<number, MapPin>());
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [selected, setSelected] = useState<{ pin: MapPin; lngLat: [number, number]; dot: boolean } | null>(null); // the pin whose card is open
  const [popupEl, setPopupEl] = useState<HTMLElement | null>(null); // where that card is drawn (a Mapbox popup on the pin)
  const glRef = useRef<typeof import("mapbox-gl").default | null>(null);
  const [dialog, setDialog] = useState(false);
  const [query, setQuery] = useState("");
  const [globe, setGlobe] = useState(false); // 2D (flat map) or 3D (globe)
  // The panel is a bottom sheet on a phone: closed (peek), half, or full. Dragging the handle moves it, then it snaps to the nearest.
  const wrap = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState(560);
  const [snap, setSnap] = useState(0);
  const [dragVis, setDragVis] = useState<number | null>(null);
  const dragging = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const pins = data.pins;
  pinsRef.current = useMemo(() => new Map(pins.map((p) => [p.id, p])), [pins]);
  const myMapPin = pins.find((p) => p.you) ?? null;

  const flyTo = useCallback((lng: number, lat: number, zoom: number) => mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1400, essential: false }), []);

  /* ---------------------------------------------------------- the map */
  useEffect(() => {
    if (!token || !box.current) return;
    let cancelled = false;
    let map: MapboxMap | undefined;
    let onScreen = new Map<string, Marker>();
    let activeEl: HTMLElement | null = null;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !box.current) return;
      glRef.current = mapboxgl;
      mapboxgl.accessToken = token;
      const width = box.current.clientWidth;
      map = new mapboxgl.Map({
        container: box.current,
        style: style ?? DEFAULT_STYLE,
        center: [12, 28],
        zoom: Math.max(0.6, Math.log2(width / 512) + 0.3),
        minZoom: 0.5,
        maxZoom: 14,
        projection: "mercator",
        renderWorldCopies: false,
        attributionControl: true,
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: window.matchMedia("(pointer: coarse)").matches, // phones: two fingers move the map, one finger scrolls the page
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();
      map.on("error", (e) => {
        if ((e.error as { status?: number } | undefined)?.status === 401 || (e.error as { status?: number } | undefined)?.status === 403) setMapError(true);
      });
      if (!style) map.on("style.load", () => tint(map!));

      const makeEl = (f: PointFeature) => {
        const props = f.properties as { cluster?: boolean; cluster_id?: number; point_count?: number; i?: number };
        if (props.cluster) {
          const count = props.point_count ?? 0;
          const size = Math.round(36 + Math.min(34, Math.log10(Math.max(count, 1)) * 14));
          const el = document.createElement("button");
          el.type = "button";
          el.className = "hm-cluster";
          el.style.cssText = `width:${size}px;height:${size}px;font-size:${size > 50 ? 15 : 13}px`;
          el.textContent = compact(count);
          el.setAttribute("aria-label", `${count} holders, zoom in`);
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            (map!.getSource("holders") as GeoJSONSource).getClusterExpansionZoom(props.cluster_id!, (err, zoom) => {
              if (err || zoom == null) return;
              map!.easeTo({ center: f.geometry.coordinates as [number, number], zoom: zoom + 0.5, duration: 700 });
            });
          });
          return { el, anchor: "center" as const, offset: [0, 0] as [number, number] };
        }
        const pin = pinsRef.current.get(props.i!);
        const shown = pin?.name && pin.lad;
        const el = document.createElement("button");
        el.type = "button";
        el.className = shown ? "hm-pin" : "hm-dot";
        if (shown) {
          el.style.backgroundImage = `url(${avatar(pin!.lad!)})`;
          el.setAttribute("aria-label", `${pin!.name}, ${pin!.city}`);
        } else el.setAttribute("aria-label", `A holder in ${pin?.city ?? "a city"}`);
        if (pin?.you) el.dataset.you = "";
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (!pin) return;
          activeEl?.removeAttribute("data-active");
          activeEl = el;
          el.setAttribute("data-active", "");
          setSelected({ pin, lngLat: f.geometry.coordinates as [number, number], dot: !shown });
        });
        // A Lad pin points at its city with the tip of its red triangle (9 px under the circle), so nudge it down by that much.
        return { el, anchor: shown ? ("bottom" as const) : ("center" as const), offset: (shown ? [0, 9] : [0, 0]) as [number, number] };
      };

      // Pins and clusters are DOM markers: add those on screen, drop those that left (Mapbox "HTML cluster markers").
      const sync = () => {
        if (!map!.getSource("holders") || !map!.isSourceLoaded("holders")) return;
        const next = new Map<string, Marker>();
        for (const f of map!.querySourceFeatures("holders") as unknown as PointFeature[]) {
          const p = f.properties as { cluster?: boolean; cluster_id?: number; i?: number };
          const id = p.cluster ? `c${p.cluster_id}` : `p${p.i}`;
          if (next.has(id)) continue;
          let marker = onScreen.get(id);
          if (!marker) {
            const { el, anchor, offset } = makeEl(f);
            marker = new mapboxgl.Marker({ element: el, anchor, offset }).setLngLat(f.geometry.coordinates as [number, number]);
          }
          next.set(id, marker);
          if (!onScreen.has(id)) marker.addTo(map!);
        }
        for (const [id, marker] of onScreen) if (!next.has(id)) marker.remove();
        onScreen = next;
      };

      resetMarkers.current = () => {
        for (const m of onScreen.values()) m.remove();
        onScreen = new Map();
        activeEl = null;
        sync();
      };

      map.on("load", () => {
        map!.addSource("holders", { type: "geojson", data: toGeoJSON([...pinsRef.current.values()]), cluster: true, clusterRadius: 44, clusterMaxZoom: 12 });
        // Mapbox only loads a source's data for a layer that draws it, and the pins are DOM markers: this invisible layer is what makes `querySourceFeatures` return them.
        map!.addLayer({ id: "holders-hidden", type: "circle", source: "holders", paint: { "circle-radius": 1, "circle-opacity": 0 } });
        let lastSync = 0;
        map!.on("render", () => {
          const now = performance.now();
          if (now - lastSync < 80) return; // while the map moves, 12 times a second is plenty
          lastSync = now;
          sync();
        });
        map!.on("idle", sync); // and once when it has stopped, so the last frame is never missed
        map!.on("click", () => {
          activeEl?.removeAttribute("data-active");
          activeEl = null;
          setSelected(null);
        });
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      resetMarkers.current = () => {};
      mapRef.current = null;
      map?.remove();
      setReady(false);
    };
  }, [token, style]);

  // The holder's card: a Mapbox popup on the pin (so it follows the pin when the map moves), filled by React through a portal.
  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!selected) {
      box.current?.querySelectorAll("[data-active]").forEach((el) => el.removeAttribute("data-active"));
      return;
    }
    if (!map || !gl) return;
    const el = document.createElement("div");
    const up = selected.dot ? 16 : 64; // a Lad pin is taller than a dot (the card sits above the pin, or below it near the top edge)
    const down = 14;
    const popup: Popup = new gl.Popup({
      closeButton: false,
      closeOnClick: false,
      closeOnMove: false,
      focusAfterOpen: false,
      maxWidth: "none",
      className: "hm-popup",
      offset: { center: [0, 0], top: [0, down], "top-left": [0, down], "top-right": [0, down], bottom: [0, -up], "bottom-left": [0, -up], "bottom-right": [0, -up], left: [down, 0], right: [-down, 0] },
    })
      .setLngLat(selected.lngLat)
      .setDOMContent(el)
      .addTo(map);
    setPopupEl(el);
    map.easeTo({ center: selected.lngLat, offset: [0, 90], duration: 500 }); // the pin a little below the middle: the card above it stays in view
    return () => {
      popup.remove();
      setPopupEl(null);
    };
  }, [selected]);

  // Escape closes the card.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  // 2D / 3D: the flat map or the globe. The globe gets a cream haze instead of Mapbox's blue one, and a zoom that fits it in the box.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setProjection(globe ? "globe" : "mercator");
    map.setFog(globe ? { color: "#fbf8f1", "high-color": "#e9dfcb", "horizon-blend": 0.03, "space-color": "#e4d9c2", "star-intensity": 0 } : null);
    if (globe) {
      const { clientWidth: w, clientHeight: h } = map.getContainer();
      map.easeTo({ zoom: Math.max(0.8, Math.log2((0.88 * Math.min(w, h)) / 135)), duration: 900 }); // the whole globe fits the box (it is about 135 px wide at zoom 0)
    }
  }, [globe, ready]);

  // New data (after saving or removing a pin): hand it to the map and rebuild the markers.
  useEffect(() => {
    const src = mapRef.current?.getSource("holders") as GeoJSONSource | undefined;
    if (!ready || !src) return;
    src.setData(toGeoJSON(pins));
    setSelected(null);
    resetMarkers.current();
  }, [pins, ready]);

  /* ---------------------------------------------------------- the panel */
  const matches = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [];
    return data.cities.filter((c) => norm(c.city).startsWith(q) || norm(countryName(c.country)).startsWith(q)).slice(0, 5);
  }, [query, data.cities]);

  // Top cities: every city on the map, biggest first (not only the part you are looking at).
  const list = data.cities.slice(0, 200);
  const maxCount = list[0]?.count ?? 1;

  const isPhone = () => window.matchMedia("(max-width: 1023px)").matches;
  const goCity = (c: MapCity) => {
    flyTo(c.lng, c.lat, 9);
    setQuery("");
    if (isPhone()) setSnap(0); // close the sheet: the map is what you came to look at
  };

  const changed = (pin: MyPin | null) => {
    setDialog(false);
    router.refresh(); // the page reads the map again: the new pin, the counts and the top cities
    if (pin) setTimeout(() => flyTo(pin.lng, pin.lat, 7), 400);
  };

  /* ---------------------------------------------------------- the bottom sheet (phones) */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const half = Math.max(PEEK + 120, Math.round(boxH * 0.5));
  const full = Math.max(half + 80, boxH - 56); // always leaves a strip of map above the sheet
  const stops = [PEEK, half, full];
  const vis = dragVis ?? stops[snap]; // px of the sheet showing right now
  const onHandleDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = { y: e.clientY, start: stops[snap], moved: false };
  };
  const onHandleMove = (e: React.PointerEvent) => {
    const d = dragging.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    if (d.moved) setDragVis(Math.min(full, Math.max(PEEK - 24, d.start + dy)));
  };
  const onHandleUp = () => {
    const d = dragging.current;
    dragging.current = null;
    if (!d?.moved) return;
    suppressClick.current = true; // the click that follows a drag is not a tap
    setTimeout(() => (suppressClick.current = false), 0);
    const cur = dragVis ?? d.start;
    let best = 0;
    stops.forEach((v, i) => {
      if (Math.abs(v - cur) < Math.abs(stops[best] - cur)) best = i;
    });
    setSnap(best);
    setDragVis(null);
  };

  return (
    <div
      ref={wrap}
      className="relative grid gap-0 max-lg:h-[calc(100svh-230px)] max-lg:min-h-[520px] max-lg:overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6"
      style={{ "--sheet-full": `${full}px`, "--sheet-off": `${full - vis}px`, "--sheet-vis": `${vis}px` } as CSSProperties}
    >
      {/* The map */}
      <div className="relative max-lg:absolute max-lg:inset-0">
        <div className="hm-map relative h-full overflow-hidden bg-sunken lg:h-[max(720px,calc(100svh-290px))] lg:rounded-[4px] lg:border lg:border-line" data-lenis-prevent>
          {/* Inline on purpose: mapbox-gl.css sets position: relative on this element, and it beats Tailwind's layered classes */}
          <div ref={box} style={{ position: "absolute", inset: 0 }} />
          {!token || mapError ? (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <p className="max-w-[360px] text-muted">The map couldn’t load. Please try again in a moment.</p>
            </div>
          ) : (
            <>
              <div className="absolute top-3 right-3 z-[2] flex flex-col overflow-hidden rounded-full bg-surface shadow-md lg:top-3 lg:right-auto lg:left-3 lg:rounded-[4px]">
                <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()} className="grid size-11 place-items-center text-2xl leading-none transition hover:bg-sunken lg:size-9">
                  +
                </button>
                <span className="mx-auto h-px w-5 bg-line lg:w-full" />
                <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()} className="grid size-11 place-items-center text-2xl leading-none transition hover:bg-sunken lg:size-9">
                  −
                </button>
              </div>
              <div role="group" aria-label="Map view" className="absolute top-3 left-3 z-[2] flex rounded-full bg-surface p-1 shadow-md lg:right-3 lg:left-auto">
                {([false, true] as const).map((g) => (
                  <button
                    key={String(g)}
                    type="button"
                    aria-pressed={globe === g}
                    onClick={() => setGlobe(g)}
                    className={`rounded-full px-4 py-2 text-sm leading-none font-semibold transition-colors ${globe === g ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                  >
                    {g ? "3D" : "2D"}
                  </button>
                ))}
              </div>
              {myMapPin && (
                <button
                  type="button"
                  aria-label="Find my pin"
                  onClick={() => flyTo(myMapPin.lng, myMapPin.lat, 8)}
                  className="absolute right-3 z-[2] grid size-11 place-items-center rounded-full bg-surface shadow-md transition hover:bg-sunken max-lg:bottom-[calc(min(var(--sheet-vis),45%)+34px)] lg:bottom-9"
                >
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <circle cx="12" cy="12" r="7" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                  </svg>
                </button>
              )}
              {pins.length === 0 && ready && (
                <p className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] mx-auto w-fit max-w-[80%] -translate-y-1/2 rounded-[4px] bg-surface px-5 py-3 text-center font-medium shadow-md">
                  Nobody is on the map yet. Be the first.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* The panel: a bottom sheet over the map on a phone (drag the handle), a column beside it on a desktop */}
      <aside
        data-lenis-prevent
        className={`relative z-10 flex flex-col gap-5 border border-line bg-surface p-5 max-lg:absolute max-lg:inset-x-0 max-lg:bottom-0 max-lg:h-[var(--sheet-full)] max-lg:translate-y-[var(--sheet-off)] max-lg:rounded-t-3xl max-lg:border-b-0 max-lg:pb-10 max-lg:shadow-[0_-8px_24px_rgb(17_17_17/0.12)] lg:h-[max(720px,calc(100svh-290px))] lg:rounded-[4px] lg:p-6 ${
          dragVis === null ? "max-lg:transition-transform max-lg:duration-300 max-lg:ease-out motion-reduce:max-lg:transition-none" : ""
        } ${snap === 2 ? "max-lg:overflow-y-auto" : "max-lg:overflow-hidden"}`}
      >
        <button
          type="button"
          aria-label="Resize the panel"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          onClick={() => !suppressClick.current && setSnap((n) => (n + 1) % 3)}
          className="-mx-5 -mt-5 grid h-9 shrink-0 touch-none place-items-center lg:hidden"
        >
          <span aria-hidden className="h-1 w-10 rounded-full bg-line" />
        </button>

        <dl className="order-1 grid grid-cols-3 gap-2">
          <Stat label="Holders" value={data.holders} />
          <Stat label="Cities" value={data.cityCount} />
          <Stat label="Countries" value={data.countryCount} />
        </dl>

        <div className="relative order-2">
          <label htmlFor="hm-search" className="sr-only">
            Search a city on the map
          </label>
          <input
            id="hm-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => isPhone() && setSnap((n) => Math.max(n, 1))}
            autoComplete="off"
            placeholder="Search a city (e.g. Tokyo, New York, Lisbon)"
            className="w-full rounded-[4px] border border-line bg-surface px-4 py-3.5 text-[16px] outline-offset-2 placeholder:text-muted focus:border-ink focus-visible:outline-2 focus-visible:outline-accent"
          />
          {query.trim() && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-[4px] border border-line bg-surface shadow-lg">
              {matches.length ? (
                matches.map((c) => (
                  <li key={cityKey(c)}>
                    <button type="button" onClick={() => goCity(c)} className="flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left hover:bg-sunken">
                      <span>
                        <span className="font-semibold">{c.city}</span>
                        <span className="text-muted">, {c.country}</span>
                      </span>
                      <span className="text-sm text-muted tabular-nums">{c.count}</span>
                    </button>
                  </li>
                ))
              ) : (
                <li className="px-4 py-3 text-sm text-muted">No holders there yet.</li>
              )}
            </ul>
          )}
        </div>

        <section className="order-4 lg:order-3 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col" aria-labelledby="hm-top">
          <h2 id="hm-top" className="text-xl font-bold tracking-[-0.02em]">
            Top cities
          </h2>
          {data.cities.length === 0 ? (
            <p className="mt-3 text-muted">The cities will show up here as holders pin themselves.</p>
          ) : (
            <ol className="mt-2 lg:min-h-0 lg:overflow-y-auto" data-lenis-prevent>
              {list.map((c, i) => {
                return (
                  <li key={cityKey(c)} className="border-b border-line last:border-0">
                    <button
                      type="button"
                      onClick={() => goCity(c)}
                      className="group grid w-full grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 py-2.5 text-left"
                    >
                      <span className="text-sm text-muted tabular-nums">{i + 1}</span>
                      <span>
                        <span className="font-semibold group-hover:text-accent">{c.city}</span>
                        <span className="text-muted">, {c.country}</span>
                        <span aria-hidden className="mt-1.5 hidden h-1.5 rounded-full bg-sunken lg:block">
                          <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(6, (c.count / maxCount) * 100)}%` }} />
                        </span>
                      </span>
                      <span className="text-muted tabular-nums">
                        {c.count}
                        <span className="lg:hidden"> {c.count === 1 ? "holder" : "holders"}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="order-3 flex flex-col gap-3 lg:order-4 lg:mt-auto">
          {!canSave ? (
            <p className="text-sm text-muted">Pins can’t be saved right now. Please try again later.</p>
          ) : mine ? (
            <div className="rounded-[4px] bg-paper p-3.5 ring-1 ring-line">
              <div className="flex items-center gap-3">
                {/* The pin as others see it: the Lad in a round frame, or the red dot for an anonymous pin */}
                <span aria-hidden className="relative grid size-12 shrink-0 place-items-center rounded-full border-[3px] border-white bg-sunken shadow-md ring-1 ring-line">
                  {mine.showIdentity && lad ? (
                    <Image src={thumbImage(lad)} alt="" fill sizes="48px" quality={70} className="rounded-full object-cover object-[50%_20%]" />
                  ) : (
                    <span className="size-3.5 rounded-full bg-red" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="t-eyebrow text-accent">Your pin</p>
                  <p className="truncate font-semibold">
                    {mine.city}, {countryName(mine.country)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {mine.showIdentity ? (
                        <>
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      ) : (
                        <>
                          <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.7 0 3.2-.4 4.5-1" />
                          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                        </>
                      )}
                    </svg>
                    {mine.showIdentity ? "Visible with your name and Lad" : "Anonymous dot"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => myMapPin && flyTo(myMapPin.lng, myMapPin.lat, 8)}
                  disabled={!myMapPin}
                  className="rounded-[4px] border-[1.5px] border-line bg-surface px-3 py-2.5 text-sm leading-none font-semibold transition-colors hover:border-ink disabled:opacity-40"
                >
                  Find on map
                </button>
                <button type="button" onClick={() => setDialog(true)} className="rounded-[4px] bg-ink px-3 py-2.5 text-sm leading-none font-semibold text-white transition-colors hover:bg-accent">
                  Edit pin
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDialog(true)}
              className="rounded-[4px] bg-accent px-6 py-4 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink"
            >
              Put me on the map
            </button>
          )}
        </div>
      </aside>

      {popupEl && selected && createPortal(<PinCard pin={selected.pin} onClose={() => setSelected(null)} />, popupEl)}

      {dialog && <PinDialog mine={mine} lad={lad} onClose={() => setDialog(false)} onChanged={changed} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[4px] border border-line px-3 py-3">
      <dt className="text-[12px] leading-tight text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tracking-[-0.03em] tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

// A holder's card, on their pin: who they are and how long they have been MAD. An anonymous dot only says which city.
function PinCard({ pin, onClose }: { pin: MapPin; onClose: () => void }) {
  const known = pin.name && pin.lad;
  return (
    <div className="w-[300px] rounded-[6px] border border-line bg-surface p-4 shadow-xl" role="group" aria-label={known ? pin.name : "Anonymous holder"}>
      <div className="flex items-start gap-3">
        {known ? (
          <span className="relative size-14 shrink-0 overflow-hidden rounded-full border-[3px] border-white bg-sunken shadow-md ring-1 ring-line">
            <Image src={thumbImage(pin.lad!)} alt="" fill sizes="56px" quality={70} className="object-cover object-[50%_20%]" />
          </span>
        ) : (
          <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-sunken">
            <span className="size-4 rounded-full bg-red" />
          </span>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-lg leading-tight font-bold tracking-[-0.02em]">{known ? pin.name : "A MAD LAD"}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {pin.you && <span className="rounded-full bg-red px-2 py-0.5 text-[11px] leading-none font-bold text-white">You</span>}
            {known && pin.handle ? (
              <a href={`https://x.com/${pin.handle}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline-offset-4 hover:text-accent hover:underline">
                View on X ↗
              </a>
            ) : (
              !known && "Prefers to stay anonymous"
            )}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-xl leading-none text-muted transition hover:text-ink">
          <span aria-hidden>×</span>
        </button>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-px overflow-hidden rounded-[4px] bg-line text-sm">
        <div className="bg-paper px-3 py-2">
          <dt className="text-[11px] tracking-wide text-muted uppercase">MAD for</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">{known && pin.since ? `${daysSince(pin.since).toLocaleString("en-US")} days` : "—"}</dd>
        </div>
        <div className="bg-paper px-3 py-2">
          <dt className="text-[11px] tracking-wide text-muted uppercase">Lives in</dt>
          <dd className="mt-0.5 truncate font-semibold">
            {pin.city}, {pin.country}
          </dd>
        </div>
      </dl>
    </div>
  );
}
