// The database (Neon Postgres), server-only. Tables: db/schema.sql (create them with npm run db:setup).
// Optional: without DATABASE_URL the site still works (share links carry the passport, settings
// stay in the browser); every caller checks `db` first.
import { neon } from "@neondatabase/serverless";

export const db = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

/* ------------------------------------------------------------ holder settings */

export type HolderSettings = { photo: number | null; since: string | null; sinceCheckedAt: string | null };

export async function getSettings(holderId: string): Promise<HolderSettings | null> {
  if (!db) return null;
  const rows = await db`select photo, since::text as since, since_checked_at from holder_settings where holder_id = ${holderId}`;
  const r = rows[0];
  return r ? { photo: r.photo ?? null, since: r.since ?? null, sinceCheckedAt: r.since_checked_at ? new Date(r.since_checked_at).toISOString() : null } : null;
}

export async function savePhoto(holderId: string, photo: number) {
  if (!db) return;
  await db`insert into holder_settings (holder_id, photo) values (${holderId}, ${photo})
           on conflict (holder_id) do update set photo = excluded.photo, updated_at = now()`;
}

export async function saveSince(holderId: string, since: string | null) {
  if (!db) return;
  await db`insert into holder_settings (holder_id, since, since_checked_at) values (${holderId}, ${since}, now())
           on conflict (holder_id) do update set since = excluded.since, since_checked_at = now(), updated_at = now()`;
}
