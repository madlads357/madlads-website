// "Today" for the MAD Horoscope is the UTC day, for everybody. Kept apart from lib/horoscope.ts (which carries all the words)
// so the browser can use it without downloading them.
export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);
export const msUntilNextUtcDay = (now = new Date()) => Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime();
