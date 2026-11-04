// Public passport links (server-only). Both are made only from a logged-in holder's session
// (app/api/passport/share), so a link always shows a real holder's passport, and expire after a year.
//   /p/<code>          with the database: a short code, the passport stored (see the end of this file)
//   /passport/<token>  without it: the token carries the passport, signed with the site's secret
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { sessionSecret } from "@/lib/auth/config";
import { ONE_OF_ONE_TYPES } from "@/lib/madlads";
import { collection } from "@/lib/madlads-server";
import type { HolderSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
function kindsOf(ids: number[]): SharedPassport["kinds"] {
  const c = collection();
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

/* ------------------------------------------------------------ stored links (database) */
// With the database: short links (madlads.com/p/<code>), one per holder, with a view count and a way
// to stop sharing. Sharing again refreshes the passport behind the same link; after "stop sharing",
// the next share gets a brand-new code (the old link stays dead).
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes (l/1, O/0)
const newCode = () => [...randomBytes(8)].map((b) => ALPHABET[b % ALPHABET.length]).join("");

export async function storeShareLink(holderId: string, p: SharedPassport): Promise<{ code: string; views: number } | null> {
  if (!db) return null;
  const expires = new Date(Date.now() + YEAR_MS).toISOString();
  const [row] = await db`select code, views, deleted_at from share_links where holder_id = ${holderId}`;
  if (row && !row.deleted_at) {
    await db`update share_links set passport = ${JSON.stringify(p)}::jsonb, updated_at = now(), expires_at = ${expires} where holder_id = ${holderId}`;
    return { code: row.code, views: row.views };
  }
  const code = newCode();
  await db`insert into share_links (code, holder_id, passport, expires_at) values (${code}, ${holderId}, ${JSON.stringify(p)}::jsonb, ${expires})
           on conflict (holder_id) do update set code = excluded.code, passport = excluded.passport, views = 0,
             created_at = now(), updated_at = now(), expires_at = excluded.expires_at, deleted_at = null`;
  return { code, views: 0 };
}

// The passport behind a short link; `count` adds a view (the page does, its preview image doesn't).
export async function readShareLink(code: string, count = false): Promise<SharedPassport | null> {
  if (!db || !/^[a-zA-Z0-9]{8}$/.test(code)) return null;
  const rows = count
    ? await db`update share_links set views = views + 1 where code = ${code} and deleted_at is null and expires_at > now() returning passport`
    : await db`select passport from share_links where code = ${code} and deleted_at is null and expires_at > now()`;
  return (rows[0]?.passport as SharedPassport | undefined) ?? null;
}

export async function deleteShareLink(holderId: string) {
  if (!db) return;
  await db`update share_links set deleted_at = now() where holder_id = ${holderId} and deleted_at is null`;
}

// Link previews (X, Discord, Slack…) fetch the page too: they shouldn't count as views.
export const isBot = (userAgent: string | null) => !userAgent || /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|embedly|x\.com|twitter/i.test(userAgent);
