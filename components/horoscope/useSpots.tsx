"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BG_SPOTS, SPOTS_NEEDED, type SpotId } from "./spots";
import { playSpot } from "./sound";

// The hidden spots of the caravan (see spots.ts): a click gives a sound, a little effect and a line from Madame Fock.
// This hook holds everything that happens: what was found (kept in this browser), the lights, the speech bubble, the stardust.
// When SPOTS_NEEDED have been found it tells the server once (POST /api/holder/curious) and the passport gets its "Curious" stamp.

const KEY = "ml_horoscope_found";
const ALL_SPOTS = 8; // fock, ball, crow, lamp, window, cat, candles, teapot

export type Rect = { left: number; top: number; width: number; height: number };
type BgSpots = Record<"crow" | "lamp" | "window", Rect>;
type Fx = { id: number; kind: SpotId; x: number; y: number };

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function useSpots({ quips, earned }: { quips: Record<string, string[]>; earned: boolean }) {
  const [found, setFound] = useState<SpotId[]>([]);
  const [bubble, setBubble] = useState<{ id: number; text: string; x: number; y: number; side: "top" | "right" } | null>(null);
  const [fx, setFx] = useState<Fx[]>([]);
  const [dark, setDark] = useState(false);
  const [flare, setFlare] = useState(0); // counters: the picture is re-keyed to play its effect again
  const [ballPop, setBallPop] = useState(0);
  const [smile, setSmile] = useState(false); // Madame Fock answers with a smile
  const [bg, setBg] = useState<BgSpots | null>(null);
  const [toast, setToast] = useState(false);
  const [earnedHere, setEarnedHere] = useState(earned);
  const [unseen, setUnseen] = useState<SpotId[]>([]); // spots that are out of sight on this screen: not clickable, not counted
  const counter = useRef(0);
  const told = useRef(false);

  // What this browser has found so far.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
      if (Array.isArray(saved)) setFound(saved.filter((s): s is SpotId => typeof s === "string"));
    } catch {
      /* nothing saved, or storage blocked */
    }
  }, []);

  // The things painted into the room picture, placed on the screen the way the background (cover) places the picture.
  useEffect(() => {
    const place = () => {
      const cfg = innerWidth >= 768 ? BG_SPOTS.wide : BG_SPOTS.tall;
      const [iw, ih] = cfg.size;
      const k = Math.max(innerWidth / iw, innerHeight / ih);
      const ox = (innerWidth - iw * k) / 2;
      const oy = (innerHeight - ih * k) / 2;
      const rect = (a: readonly number[]): Rect => ({ left: ox + a[0] * k, top: oy + a[1] * k, width: a[2] * k, height: a[3] * k });
      setBg({ crow: rect(cfg.crow), lamp: rect(cfg.lamp), window: rect(cfg.window) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // On a screen where part of the room is out of sight (a phone) fewer spots can be found, so fewer are needed.
  const reachable = ALL_SPOTS - unseen.length;
  const needed = Math.min(SPOTS_NEEDED, Math.max(2, reachable - 1));
  const seen = found.filter((s) => !unseen.includes(s));
  const setOutOfSight = useCallback((ids: SpotId[]) => setUnseen((cur) => (cur.length === ids.length && cur.every((x) => ids.includes(x)) ? cur : ids)), []);

  const tell = useCallback(() => {
    if (told.current) return;
    told.current = true;
    fetch("/api/holder/curious", { method: "POST" })
      .then((r) => r.ok && setEarnedHere(true))
      .catch(() => {
        told.current = false; // try again next time
      });
  }, []);

  // Enough found in an earlier visit but the server was never told (a closed tab, no connection): tell it now.
  useEffect(() => {
    if (!earnedHere && seen.length >= needed) tell();
  }, [seen.length, needed, earnedHere, tell]);

  const trigger = useCallback(
    (id: SpotId, el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      // Madame Fock and the crow speak from the side of their head (the bubble sits to the right of it); the rest above the spot.
      const side = id === "fock" || id === "crow" ? "right" : "top";
      const at = side === "right" ? { x: id === "fock" ? r.left + r.width * 0.78 : r.right, y: r.top + r.height * (id === "fock" ? (innerWidth < 768 ? 0.05 : 0.2) : 0.3) } : { x, y };
      const n = ++counter.current;

      // the lamp: lights out, lights on
      const lamp = id === "lamp";
      const nextDark = lamp ? !dark : dark;
      if (lamp) setDark(nextDark);
      playSpot(lamp ? (nextDark ? "lampOff" : "lampOn") : id);

      const line = pick(quips[lamp ? (nextDark ? "lampOff" : "lampOn") : id] ?? ["..."]);
      setBubble({ id: n, text: line, x: at.x, y: at.y, side });
      setTimeout(() => setBubble((b) => (b && b.id === n ? null : b)), 3400);

      if (id === "candles") setFlare((c) => c + 1);
      if (id === "ball") setBallPop((c) => c + 1);
      if (id === "fock") {
        setSmile(true);
        setTimeout(() => setSmile(false), 1100);
      }
      if (id === "cat" || id === "crow" || id === "window" || id === "teapot") {
        setFx((list) => [...list.slice(-6), { id: n, kind: id, x, y }]);
        setTimeout(() => setFx((list) => list.filter((f) => f.id !== n)), 3000);
      }

      // found!
      if (!found.includes(id)) {
        const next = [...found, id];
        setFound(next);
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* fine */
        }
        if (next.filter((s) => !unseen.includes(s)).length === needed && !earnedHere) {
          setTimeout(() => {
            playSpot("found");
            setToast(true);
            setTimeout(() => setToast(false), 6000);
          }, 900);
          tell();
        }
      }
    },
    [dark, found, quips, earnedHere, tell, unseen, needed],
  );

  // What floats above the room: stardust of every kind, the speech bubble, the counter, the stamp message.
  const layer: ReactNode = (
    <>
      {fx.map((f) => (
        <div key={f.id} className={`hz-fx hz-fx-${f.kind}`} style={{ left: f.x, top: f.y } as CSSProperties} aria-hidden>
          {f.kind === "cat" && ["z", "z", "Z"].map((c, i) => <i key={i} style={{ "--i": i } as CSSProperties}>{c}</i>)}
          {f.kind === "crow" && [0, 1, 2, 3].map((i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}
          {f.kind === "teapot" && [0, 1, 2].map((i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}
          {f.kind === "window" && <i />}
        </div>
      ))}
      {bubble && (
        <div key={bubble.id} className={`hz-bubble hz-bubble-${bubble.side}`} style={{ left: bubble.x, top: bubble.y, "--bx": `${bubble.x}px` } as CSSProperties} role="status">
          {bubble.text}
        </div>
      )}
      {seen.length > 0 && (
        <div className="hz-found" aria-live="polite">
          {earnedHere ? "✦ Curious" : `✦ ${Math.min(seen.length, needed)} / ${needed}`}
        </div>
      )}
      {toast && (
        <div className="hz-toast" role="status">
          {quips.found[0]}
        </div>
      )}
    </>
  );

  return { bg, dark, flare, ballPop, smile, trigger, layer, unseen, setOutOfSight };
}
