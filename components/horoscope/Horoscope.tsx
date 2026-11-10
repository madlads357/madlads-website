"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { thumbImage } from "@/lib/madlads";
import type { Reading } from "@/lib/horoscope";
import { drawShareCard } from "./share-card";
import { BANNER_PATH, RIBBON_PATH } from "./geometry";
import { msUntilNextUtcDay, utcDay } from "@/lib/utc-day";
import { arrive } from "./enter";
import { playArrive, playDraw, setSoundWanted, soundWanted } from "./sound";
import { SPOT_LABEL, TABLE_SPOTS, type SpotId } from "./spots";
import { useSpots } from "./useSpots";
import "./enter.css";
import "./horoscope.css";

// The MAD Horoscope page (a tarot caravan). The pictures are layers (public/horoscope, made by scripts/build-horoscope-assets.mjs);
// everything that changes is live text on top of them. Four moments:
//   idle      Madame Fock has your card: "Draw my card"
//   drawing   the card comes off the deck and turns over (about two seconds)
//   reading   the card and the reading
//   resting   already drawn today: the card on the table, "come back tomorrow" and the time left
// What was drawn today is remembered in this browser only (localStorage), because the reading itself comes from the login and the date.

type Phase = "boot" | "idle" | "drawing" | "reading" | "resting";
const KEY = "ml_horoscope";

// Stardust that flies off the card while it turns over, and motes of light that drift in the room. Fixed numbers, so the
// server and the browser draw the same page.
const SPARKS = Array.from({ length: 18 }, (_, i) => ({
  angle: Math.round((i * 137.5) % 360),
  dist: 70 + ((i * 37) % 55), // how far, as a percentage of the card
  delay: (0.15 + ((i * 0.12) % 1.3)).toFixed(2),
  size: 8 + ((i * 5) % 9),
}));
const MOTES = Array.from({ length: 14 }, (_, i) => ({
  x: 16 + ((i * 53) % 68),
  delay: -((i * 1.9) % 11).toFixed(1),
  dur: 9 + ((i * 7) % 8),
  size: 3 + (i % 3) * 2,
}));

const ROMAN: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
const roman = (n: number) => {
  let out = "";
  for (const [v, s] of ROMAN) while (n >= v) (out += s), (n -= v);
  return out;
};
const dateLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const clock = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
};

type Props = { name: string; lad: number; reading: Reading; number: number; reader: string; site: string; quips: Record<string, string[]>; earned: boolean };

export function Horoscope({ name, lad, reading, number, reader, site, quips, earned }: Props) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("boot");
  const [left, setLeft] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(true);
  const [arrived, setArrived] = useState(false); // we came through the crystal ball's mist
  const spots = useSpots({ quips, earned });

  // What happened today in this browser.
  useEffect(() => {
    let drawn = false;
    try {
      drawn = localStorage.getItem(KEY) === reading.date;
    } catch {
      /* storage blocked: start from the deck */
    }
    setPhase(drawn ? "resting" : "idle");
  }, [reading.date]);

  // The clock to midnight UTC. Once the day has really changed and the page still shows yesterday's reading, it asks the server
  // again, every few seconds, up to five times (a clock that is wrong must not make it ask for ever).
  useEffect(() => {
    let lastAsk = 0;
    let asked = 0;
    const tick = () => {
      setLeft(msUntilNextUtcDay());
      if (asked < 5 && utcDay() !== reading.date && Date.now() - lastAsk > 4000) {
        lastAsk = Date.now();
        asked++;
        router.refresh();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [router, reading.date]);

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => setSound(soundWanted()), []);

  // Came through the crystal ball: once the room is ready, the mist thins away and the room settles in.
  useEffect(() => {
    if (phase === "boot") return;
    const t = setTimeout(() => {
      if (arrive()) {
        setArrived(true);
        playArrive();
      }
    }, 250);
    return () => clearTimeout(t);
  }, [phase]);

  const draw = useCallback(() => {
    try {
      localStorage.setItem(KEY, reading.date);
    } catch {
      /* fine */
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("reading");
    playDraw();
    setPhase("drawing");
    timer.current = setTimeout(() => setPhase("reading"), 3000);
  }, [reading.date]);

  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    setSoundWanted(on);
    if (on) playArrive(); // a small bell, so you hear that it is on
  };

  const post = () => {
    const text = `My MAD horoscope today: “${reading.omen}” (${reading.card.name}, mood: ${reading.mood})`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(location.origin)}`, "_blank", "noopener,noreferrer");
  };

  const download = async () => {
    if (busy || !root.current) return;
    setBusy(true);
    setError("");
    try {
      const style = getComputedStyle(root.current);
      const blob = await drawShareCard({
        reading,
        number: roman(number),
        lad,
        site,
        display: style.getPropertyValue("--font-hz-display").trim() || "serif",
        body: style.getPropertyValue("--font-hz-body").trim() || "serif",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mad-horoscope-${reading.date}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error("[horoscope] could not make the picture:", e);
      setError("Couldn’t make the picture. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const scene = phase === "idle" || phase === "drawing" || phase === "resting" || phase === "boot";
  const spotsOn = phase === "idle" || phase === "resting"; // the hidden spots can be clicked while the room is calm

  // Which spots can be seen on this screen? On a phone the room is cut at the sides, so part of the table (the cat, the teapot…) and
  // most of the window are out of sight: those cannot be clicked and do not count towards "Curious".
  const { setOutOfSight } = spots;
  useEffect(() => {
    if (!spotsOn) return;
    const measure = () => {
      const hidden: SpotId[] = [];
      document.querySelectorAll<HTMLElement>(".hz-spot[data-spot]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
        const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
        // seen enough of it (a crow cut by the screen edge still counts; a sliver of a window or a cat does not)
        if (r.width * r.height > 0 && ((w * h) / (r.width * r.height) < 0.4 || w < 40 || h < 40)) hidden.push(el.dataset.spot as SpotId);
      });
      setOutOfSight(hidden);
    };
    measure();
    const later = setTimeout(measure, 1600); // after the room has settled in
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(later);
      window.removeEventListener("resize", measure);
    };
  }, [spotsOn, setOutOfSight, spots.bg]);

  // One of the hidden spots: an invisible button over the painted object.
  const spot = (id: SpotId, style: React.CSSProperties, className = "hz-spot") => {
    const off = spots.unseen.includes(id);
    return (
      <button
        key={id}
        type="button"
        className={className}
        style={style}
        data-spot={id}
        data-off={off || undefined}
        disabled={off}
        tabIndex={off ? -1 : undefined}
        aria-label={SPOT_LABEL[id]}
        onClick={(e) => spots.trigger(id, e.currentTarget)}
      />
    );
  };
  const onTable = (id: keyof typeof TABLE_SPOTS & SpotId) => {
    const [l, t, w, h] = TABLE_SPOTS[id];
    return spot(id, { left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` });
  };

  return (
    <main id="main" ref={root} className="hz" data-phase={phase} data-arrive={arrived || undefined} data-dark={(spots.dark && scene) || undefined}>
      <div className="hz-bg" aria-hidden />
      <div className="hz-stars" aria-hidden />
      <Link href="/holders" className="hz-back">
        <span aria-hidden>←</span> Holder area
      </Link>
      <button type="button" className="hz-sound" onClick={toggleSound} aria-pressed={sound} aria-label="Sound">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 5 6 9H3v6h3l5 4V5Z" fill="currentColor" />
          {sound ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
        </svg>
      </button>

      {spotsOn && spots.bg && (
        <>
          {spot("crow", { ...spots.bg.crow }, "hz-spot hz-spot-bg")}
          {spot("lamp", { ...spots.bg.lamp }, "hz-spot hz-spot-bg")}
          {spot("window", { ...spots.bg.window }, "hz-spot hz-spot-bg")}
        </>
      )}
      {spots.layer}

      <div className="hz-stage" data-phase={phase}>
        {/* the title banner, with the date line on its ribbon */}
        <div className="hz-title">
          <h1>
            {/* plain <img> on purpose: these are already-optimised static pictures with transparency */}
            <img src="/horoscope/title.webp" alt="MAD Horoscope" width={870} height={399} decoding="async" />
          </h1>
          <RibbonText text={`${name} · ${dateLabel(reading.date)}`} label={`${reader}’s reading for ${name}, ${dateLabel(reading.date)}`} />
        </div>

        {scene && (
          <div className="hz-scene" data-phase={phase}>
            <div className="hz-motes" aria-hidden>
              {MOTES.map((m, i) => (
                <i key={i} style={{ "--x": `${m.x}%`, "--delay": `${m.delay}s`, "--dur": `${m.dur}s`, "--s": `${m.size}px` } as React.CSSProperties} />
              ))}
            </div>

            <div className="hz-fock" data-smile={spots.smile || undefined}>
              <img className="hz-pose hz-pose-wink" src="/horoscope/fock-wink.webp" alt="" decoding="async" />
              <img className="hz-pose hz-pose-rest" src="/horoscope/fock-rest.webp" alt="" decoding="async" />
              <img className="hz-pose hz-pose-card" src="/horoscope/fock-card.webp" alt="" decoding="async" />
              {spotsOn && spot("fock", { inset: "6% 16% 34% 16%" })}
            </div>

            <div className="hz-table">
              <img src="/horoscope/table.webp" alt="" width={1536} height={637} decoding="async" />
              <span key={`c${spots.flare}`} className={`hz-glow hz-glow-candle${spots.flare ? " hz-flare" : ""}`} aria-hidden />
              <span key={`b${spots.ballPop}`} className={`hz-glow hz-glow-ball${spots.ballPop ? " hz-pop" : ""}`} aria-hidden />
              {spotsOn && (
                <>
                  {onTable("teapot")}
                  {onTable("candles")}
                  {onTable("ball")}
                  {onTable("cat")}
                  {phase === "idle" && (
                    <button type="button" className="hz-spot" style={{ left: "38.4%", top: "26%", width: "21.6%", height: "36%" }} aria-label="Draw my card" onClick={draw} />
                  )}
                </>
              )}
              {/* the card that comes off the deck and turns over (not once it is resting on the table: that is its own card) */}
              {phase !== "resting" && (
              <div className="hz-flip" aria-hidden>
                <span className="hz-aura" />
                <span className="hz-burst" />
                {SPARKS.map((s, i) => (
                  <i key={i} className="hz-spark" style={{ "--a": `${s.angle}deg`, "--d": `${s.dist}%`, "--delay": `${s.delay}s`, "--s": `${s.size}px` } as React.CSSProperties} />
                ))}
                <div className="hz-flip-inner">
                  <img className="hz-flip-back" src="/horoscope/card-back.webp" alt="" />
                  <div className="hz-flip-front">
                    <TarotCard lad={lad} name={reading.card.name} number={roman(number)} priority />
                  </div>
                </div>
              </div>
              )}
            </div>

            {phase === "drawing" && <div className="hz-dim" aria-hidden />}

            {phase === "idle" && (
              <div className="hz-ask">
                <p>{reader} has your card. Ready?</p>
                <button type="button" className="hz-btn hz-btn-red" onClick={draw}>
                  Draw my card
                </button>
              </div>
            )}

            {phase === "resting" && (
              <>
                <button type="button" className="hz-restcard" onClick={() => setPhase("reading")} aria-label="Read today’s reading again">
                  <TarotCard lad={lad} name={reading.card.name} number={roman(number)} />
                </button>
                <div className="hz-sign">
                  <img src="/horoscope/easel.webp" alt="" width={449} height={623} decoding="async" />
                  <div className="hz-sign-text">
                    <p className="hz-sign-big">Come back tomorrow.</p>
                    <p className="hz-sign-small">The cards are resting.</p>
                    <p className="hz-clock">
                      New reading in <time>{left === null ? "--:--:--" : clock(left)}</time>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {phase === "reading" && (
          <div className="hz-reading">
            <div className="hz-reading-card">
              <TarotCard lad={lad} name={reading.card.name} number={roman(number)} />
            </div>

            <div className="hz-reading-main">
              <section className="hz-panel">
                <button type="button" className="hz-close" onClick={() => setPhase("resting")} aria-label="Put the card back on the table">
                  <span aria-hidden>×</span>
                </button>
                <h2 className="hz-card-title">{reading.card.name}</h2>
                <p className="hz-meaning">{reading.card.meaning}</p>
                <p className="hz-text">{reading.omen}</p>
                <dl className="hz-rows">
                  <div>
                    <dt className="hz-tag hz-tag-do">Do</dt>
                    <dd>{reading.advice}</dd>
                  </div>
                  <div>
                    <dt className="hz-tag hz-tag-avoid">Avoid</dt>
                    <dd>{reading.warning}</dd>
                  </div>
                </dl>
                <div className="hz-chips">
                  <span className="hz-chip">Mood: {reading.mood}</span>
                </div>
                {reading.extra && <p className="hz-extra">{reading.extra}</p>}
              </section>

              <div className="hz-actions">
                <button type="button" className="hz-btn hz-btn-red" onClick={post}>
                  Post on <XMark />
                </button>
                <button type="button" className="hz-btn hz-btn-dark" onClick={download} disabled={busy}>
                  {busy ? "Making your card…" : "Download card"}
                </button>
              </div>
              {error && (
                <p role="alert" className="hz-error">
                  {error}
                </p>
              )}
              <p className="hz-hint">Tip: download the card, then add it to your post.</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// The tarot card: the Lad in the arched window (under the frame), the number on the plate, the name on the banner.
function TarotCard({ lad, name, number, priority }: { lad: number; name: string; number: string; priority?: boolean }) {
  return (
    <div className="hz-card">
      <div className="hz-card-art">
        <Image src={thumbImage(lad)} alt="" fill sizes="(min-width: 768px) 28vw, 60vw" quality={75} className="object-cover" priority={priority} />
      </div>
      <img className="hz-card-frame" src="/horoscope/card-front.webp" alt="" width={484} height={805} decoding="async" />
      <span className="hz-card-num">{number}</span>
      <CardName name={name.toUpperCase()} />
    </div>
  );
}

// The date line, on the curve of the title's ribbon (the picture is 870 x 399, the text follows RIBBON_PATH).
function RibbonText({ text, label }: { text: string; label: string }) {
  const id = useId();
  const size = Math.min(36, 430 / (text.length * 0.46)); // the band is about 460 wide: longer names get smaller letters
  return (
    <svg className="hz-sub" viewBox="0 0 870 399" role="img" aria-label={label}>
      <defs>
        <path id={id} d={RIBBON_PATH} />
      </defs>
      <text aria-hidden transform={`translate(0 ${size * 0.34})`} fill="#4a2a0a" style={{ fontFamily: "var(--font-hz-body), Georgia, serif", fontWeight: 700, fontSize: size }}>
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {text}
        </textPath>
      </text>
    </svg>
  );
}

// The card's name, on the curve of its banner (the picture is 484 x 805, the text follows BANNER_PATH).
function CardName({ name }: { name: string }) {
  const id = useId();
  const size = Math.min(40, 285 / (name.length * 0.8));
  return (
    <svg className="hz-card-svg" viewBox="0 0 484 805" aria-hidden>
      <defs>
        <path id={id} d={BANNER_PATH} />
      </defs>
      <text transform={`translate(0 ${size * 0.34})`} fill="#4a2a0a" style={{ fontFamily: "var(--font-hz-display), Georgia, serif", fontWeight: 800, fontSize: size, letterSpacing: "0.02em" }}>
        <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
          {name}
        </textPath>
      </text>
    </svg>
  );
}

const XMark = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="hz-x" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
