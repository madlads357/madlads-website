// The sounds of the MAD Horoscope, made in the browser with the Web Audio API: no sound files to load or to license.
// Three small pieces of music box and mist: stepping into the caravan, drawing the card, and (quietly) arriving.
// They only play after a click (browsers insist), and a visitor can switch them off: the choice is kept in this browser.

const KEY = "ml_horoscope_sound";

export const soundWanted = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};
export const setSoundWanted = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* fine */
  }
};

/* ------------------------------------------------------------ building blocks (they take any audio context, so they can be tested offline) */

const noises = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext) {
  let buf = noises.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noises.set(ctx, buf);
  }
  return buf;
}

// Everything goes through a short echo (a small room) and a gentle limiter, so nothing ever clips. Built once per audio
// context: the echo loop never goes away once it is connected, so a new one at every sound would pile up.
const outputs = new WeakMap<BaseAudioContext, AudioNode>();
export function output(ctx: BaseAudioContext) {
  const cached = outputs.get(ctx);
  if (cached) return cached;
  const input = ctx.createGain();
  input.gain.value = 0.9;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -10;
  limiter.ratio.value = 8;
  const dry = ctx.createGain();
  dry.gain.value = 0.85;
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.2;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 2600;
  const wet = ctx.createGain();
  wet.gain.value = 0.34;
  input.connect(dry).connect(limiter);
  input.connect(echo);
  echo.connect(tone).connect(feedback).connect(echo);
  tone.connect(wet).connect(limiter);
  limiter.connect(ctx.destination);
  outputs.set(ctx, input);
  return input;
}

// A bell: three sine partials that die away at different speeds.
function bell(ctx: BaseAudioContext, out: AudioNode, t: number, freq: number, dur: number, vol: number) {
  for (const [mult, share, life] of [[1, 1, 1], [2.01, 0.35, 0.6], [3.97, 0.12, 0.35]] as const) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * mult;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * share, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * life);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

// Wind: noise through a band that slides from f0 to f1.
function whoosh(ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, f0: number, f1: number, vol: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  n.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.3;
  band.frequency.setValueAtTime(f0, t);
  band.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(band).connect(g).connect(out);
  n.start(t);
  n.stop(t + dur + 0.1);
}

// A soft low thud (a card on velvet, a door of air).
function thump(ctx: BaseAudioContext, out: AudioNode, t: number, vol: number, from = 150) {
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(48, t + 0.26);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.35);
}

// A glitter of high air: a few very short bursts.
function sparkle(ctx: BaseAudioContext, out: AudioNode, t: number, vol: number) {
  for (let i = 0; i < 4; i++) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5200 + i * 700;
    const g = ctx.createGain();
    const at = t + i * 0.075;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09);
    n.connect(hp).connect(g).connect(out);
    n.start(at, Math.random());
    n.stop(at + 0.12);
  }
}

// A low, slow chord that swells under everything.
function pad(ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, vol: number) {
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(260, t);
  lp.frequency.exponentialRampToValueAtTime(1100, t + dur * 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g).connect(out);
  for (const f of [110, 164.81, 220.5, 277.18]) {
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    o.detune.value = (f % 7) - 3;
    o.connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

// A cat's purr: low noise, chopped about 24 times a second.
function purr(ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, vol: number) {
  const n = ctx.createBufferSource();
  n.buffer = noise(ctx);
  n.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 190;
  lp.Q.value = 0.8;
  const chop = ctx.createGain();
  chop.gain.value = 0.55;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 24;
  const depth = ctx.createGain();
  depth.gain.value = 0.45;
  lfo.connect(depth).connect(chop.gain);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(vol, t + 0.35);
  env.gain.setValueAtTime(vol, t + dur - 0.5);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(lp).connect(chop).connect(env).connect(out);
  n.start(t);
  n.stop(t + dur + 0.1);
  lfo.start(t);
  lfo.stop(t + dur + 0.1);
}

// A caw: a rough falling tone through a throat-like band, with a rasp on top.
function caw(ctx: BaseAudioContext, out: AudioNode, t: number, pitch: number, vol: number) {
  const o = ctx.createOscillator();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(640 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(360 * pitch, t + 0.24);
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1250;
  band.Q.value = 2.4;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
  o.connect(band).connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.32);
  sparkle(ctx, out, t, vol * 0.1);
}

// A small switch: two clicks and a warm hum.
function click(ctx: BaseAudioContext, out: AudioNode, t: number, up: boolean) {
  for (const at of [t, t + 0.06]) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.5, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
    n.connect(hp).connect(g).connect(out);
    n.start(at, Math.random());
    n.stop(at + 0.06);
  }
  thump(ctx, out, t + 0.02, 0.25, up ? 220 : 160);
}

// Candles flaring: a quick breath and a few crackles.
function crackle(ctx: BaseAudioContext, out: AudioNode, t: number, vol: number) {
  for (let i = 0; i < 7; i++) {
    const n = ctx.createBufferSource();
    n.buffer = noise(ctx);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2800 + ((i * 631) % 2200);
    const g = ctx.createGain();
    const at = t + 0.05 + i * 0.07 + ((i * 37) % 30) / 1000;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    n.connect(hp).connect(g).connect(out);
    n.start(at, Math.random());
    n.stop(at + 0.05);
  }
}

// Steam: a hiss that swells, and a thin whistle on top.
function whistle(ctx: BaseAudioContext, out: AudioNode, t: number, dur: number, vol: number) {
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(1800, t);
  o.frequency.linearRampToValueAtTime(2250, t + dur);
  const vib = ctx.createOscillator();
  vib.frequency.value = 7;
  const vibDepth = ctx.createGain();
  vibDepth.gain.value = 22;
  vib.connect(vibDepth).connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
  vib.start(t);
  vib.stop(t + dur + 0.05);
}

const PENTATONIC = [440, 523.25, 659.25, 783.99, 880, 1046.5, 1318.5]; // A minor pentatonic, climbing

/* ------------------------------------------------------------ the pieces, laid out in time (t0 = now) */

// Drawing the card (3 seconds, in step with the animation): mist rises, bells climb, the card turns, a chord blooms.
export function scheduleDraw(ctx: BaseAudioContext, out: AudioNode, t0: number) {
  whoosh(ctx, out, t0, 1.5, 220, 2400, 0.5);
  pad(ctx, out, t0, 3, 0.07);
  PENTATONIC.forEach((f, i) => bell(ctx, out, t0 + 0.1 + i * 0.16, f, 1.6, 0.05 + i * 0.008));
  whoosh(ctx, out, t0 + 1.35, 0.55, 700, 3200, 0.34); // the card turns over
  thump(ctx, out, t0 + 1.55, 0.5);
  const reveal = t0 + 1.98; // the face shows: a bright chord and a glitter
  for (const f of [659.25, 987.77, 1318.5, 1975.5]) bell(ctx, out, reveal, f, 2.4, 0.11);
  sparkle(ctx, out, reveal, 0.05);
  sparkle(ctx, out, reveal + 0.3, 0.035);
  thump(ctx, out, t0 + 2.98, 0.2, 110); // and the reading lands
}

// Stepping into the caravan (about 1.5 seconds): the crystal ball swallows the screen.
export function scheduleEnter(ctx: BaseAudioContext, out: AudioNode, t0: number) {
  whoosh(ctx, out, t0, 1.35, 140, 2000, 0.55);
  thump(ctx, out, t0 + 0.45, 0.45, 120);
  pad(ctx, out, t0, 1.8, 0.06);
  [659.25, 987.77, 1318.5].forEach((f, i) => bell(ctx, out, t0 + 0.7 + i * 0.16, f, 1.5, 0.08));
  sparkle(ctx, out, t0 + 1.15, 0.04);
}

// Arriving: one soft bell, so the room feels like it was waiting.
export function scheduleArrive(ctx: BaseAudioContext, out: AudioNode, t0: number) {
  bell(ctx, out, t0, 880, 2, 0.07);
  bell(ctx, out, t0 + 0.18, 1318.5, 2, 0.05);
}

// The hidden spots of the caravan (about a second each).
export type SpotSound = "fock" | "ball" | "crow" | "lampOn" | "lampOff" | "window" | "cat" | "candles" | "teapot" | "found";
export function scheduleSpot(ctx: BaseAudioContext, out: AudioNode, t0: number, kind: SpotSound) {
  switch (kind) {
    case "cat":
      purr(ctx, out, t0, 2, 1.1);
      break;
    case "crow":
      caw(ctx, out, t0, 1, 0.5);
      caw(ctx, out, t0 + 0.34, 0.88, 0.42);
      break;
    case "lampOff":
      click(ctx, out, t0, false);
      whoosh(ctx, out, t0 + 0.1, 0.7, 900, 200, 0.18);
      break;
    case "lampOn":
      click(ctx, out, t0, true);
      bell(ctx, out, t0 + 0.12, 880, 1.2, 0.05);
      break;
    case "window":
      whoosh(ctx, out, t0, 0.6, 1800, 7000, 0.2);
      [1760, 1568, 1318.5, 1046.5].forEach((f, i) => bell(ctx, out, t0 + 0.12 + i * 0.09, f, 1.4, 0.07));
      sparkle(ctx, out, t0 + 0.5, 0.04);
      break;
    case "candles":
      whoosh(ctx, out, t0, 0.45, 300, 2400, 0.4);
      crackle(ctx, out, t0 + 0.1, 0.12);
      break;
    case "teapot":
      whoosh(ctx, out, t0, 1.2, 3500, 6500, 0.22);
      whistle(ctx, out, t0 + 0.25, 0.9, 0.045);
      break;
    case "ball":
      whoosh(ctx, out, t0, 0.9, 500, 1500, 0.2);
      [659.25, 880, 1174.7].forEach((f, i) => bell(ctx, out, t0 + 0.15 + i * 0.18, f, 1.6, 0.07));
      sparkle(ctx, out, t0 + 0.7, 0.035);
      break;
    case "fock":
      bell(ctx, out, t0, 1318.5, 1.3, 0.08);
      bell(ctx, out, t0 + 0.07, 1975.5, 1, 0.05);
      break;
    case "found":
      [880, 1046.5, 1318.5, 1760].forEach((f, i) => bell(ctx, out, t0 + i * 0.13, f, 2.2, 0.09));
      bell(ctx, out, t0 + 0.6, 2093, 2.6, 0.07);
      sparkle(ctx, out, t0 + 0.55, 0.05);
      break;
  }
}

/* ------------------------------------------------------------ playing them */

let shared: AudioContext | null = null;
function live() {
  if (typeof window === "undefined" || !soundWanted()) return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  shared ??= new Ctor();
  if (shared.state === "suspended") void shared.resume();
  return shared;
}
function play(schedule: (ctx: BaseAudioContext, out: AudioNode, t0: number) => void) {
  try {
    const ctx = live();
    if (ctx) schedule(ctx, output(ctx), ctx.currentTime + 0.03);
  } catch (e) {
    console.warn("[horoscope] no sound:", (e as Error).message);
  }
}

export const playDraw = () => play(scheduleDraw);
export const playEnter = () => play(scheduleEnter);
export const playArrive = () => play(scheduleArrive);
export const playSpot = (kind: SpotSound) => play((ctx, out, t0) => scheduleSpot(ctx, out, t0, kind));
