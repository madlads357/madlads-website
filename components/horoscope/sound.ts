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

// While building: a hook to render the pieces offline and check their levels (see the notes in the README).
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __hzSound?: unknown }).__hzSound = { scheduleDraw, scheduleEnter, scheduleArrive, output };
}
