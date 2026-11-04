// Public passport links (server-only): /passport/<token>.
// The token carries the passport itself (no database), signed with the site's secret so it can't be
// edited or made up, and it expires after a year. Tokens are only made from a logged-in holder's
// session (app/api/passport/share), so a link always shows a real holder's passport.
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sessionSecret } from "@/lib/auth/config";
import { ONE_OF_ONE_TYPES } from "@/lib/madlads";
import type { HolderSession } from "@/lib/auth/session";

export type SharedPassport = {
  name: string;
  handle?: string;
  since?: string; // ISO date
  roles?: string[];
  photo: number;
  count: number; // Lads held
  kinds: { skull: boolean; oneOfOne: boolean; lassie: boolean }; // for the stamps
  issued: string; // ISO day the link was made (the "Issued" stamp)
};
type Payload = SharedPassport & { exp: number };

const YEAR_MS = 365 * 86_400_000;
const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", sessionSecret()).update(`passport:${body}`).digest("base64url").slice(0, 27);

export function makeShareToken(p: SharedPassport): string {
  const body = b64(JSON.stringify({ ...p, exp: Date.now() + YEAR_MS } satisfies Payload));
  return `${body}.${sign(body)}`;
}

export function readShareToken(token: string): SharedPassport | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const { exp, ...p } = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    return exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

// Which kinds of Lad the holder has (Skull, 1/1, Lassie), from the collection data on disk.
let collection: { traits: { name: string; values: string[] }[]; lads: number[][] } | null = null;
function kindsOf(ids: number[]): SharedPassport["kinds"] {
  collection ??= JSON.parse(readFileSync(join(process.cwd(), "public/data/madlads.json"), "utf8"));
  const c = collection!;
  const ti = c.traits.findIndex((t) => t.name === "Type");
  const gi = c.traits.findIndex((t) => t.name === "Gender");
  const set = new Set(ids);
  const held = c.lads.filter((l) => set.has(l[0]));
  const types = held.map((l) => c.traits[ti].values[l[ti + 1]]);
  return {
    skull: types.includes("Skull"),
    oneOfOne: types.some((t) => ONE_OF_ONE_TYPES.includes(t)),
    lassie: held.some((l) => l[gi + 1] >= 0 && c.traits[gi].values[l[gi + 1]] === "Female"),
  };
}

export function shareFromSession(s: HolderSession, photo: number): SharedPassport {
  return {
    name: s.name,
    handle: s.handle,
    since: s.since,
    roles: s.roles?.slice(0, 2),
    photo: s.lads.includes(photo) ? photo : s.lads[0],
    count: s.lads.length,
    kinds: kindsOf(s.lads),
    issued: new Date().toISOString().slice(0, 10),
  };
}
