// The "who is logged in" hint the header shows (name + a Lad for the picture).
// Set and cleared with the session (lib/auth/session.ts), read in the browser by components/Nav.tsx.
// Display only: it proves nothing, the holder area always checks the encrypted session.
export const HINT = "ml_user";
export type HeaderHint = { name: string; lad: number | null };

export function readHint(cookie: string): HeaderHint | null {
  const raw = cookie.split("; ").find((c) => c.startsWith(`${HINT}=`));
  if (!raw) return null;
  try {
    const hint = JSON.parse(decodeURIComponent(raw.slice(HINT.length + 1))) as HeaderHint;
    return typeof hint?.name === "string" ? hint : null;
  } catch {
    return null;
  }
}

// The Lad the holder picked as passport photo, remembered in this browser. The header uses it as
// their picture; picking a new one fires PHOTO_EVENT so the header updates right away.
export const PHOTO_KEY = "ml:passport-photo";
export const PHOTO_EVENT = "ml:photo";
