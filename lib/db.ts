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

/* ------------------------------------------------------------ vault links (wallet login) */

export const MAX_VAULTS = 10; // vault wallets one hot wallet can link

// The vault wallets linked to this hot wallet, oldest first.
export async function vaultsOf(hot: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db`select vault from wallet_links where hot = ${hot} order by created_at limit ${MAX_VAULTS}`;
  return rows.map((r) => r.vault as string);
}

export async function linkVault(vault: string, hot: string) {
  if (!db) throw new Error("No database");
  await db`insert into wallet_links (vault, hot) values (${vault}, ${hot}) on conflict do nothing`;
}

export async function unlinkVault(vault: string, hot: string) {
  if (!db) return;
  await db`delete from wallet_links where vault = ${vault} and hot = ${hot}`;
}

/* ------------------------------------------------------------ linked accounts (Discord, X) */

export type Provider = "discord" | "x";
export type LinkedAccount = { provider: Provider; accountId: string; name: string; roles: string[] };

export async function accountsOf(holderId: string): Promise<LinkedAccount[]> {
  if (!db) return [];
  const rows = await db`select provider, account_id, name, roles from holder_accounts where holder_id = ${holderId}`;
  return rows.map((r) => ({ provider: r.provider as Provider, accountId: r.account_id as string, name: r.name as string, roles: (r.roles as string[] | null) ?? [] }));
}

// Links the account to this holder, taking it away from any other holder first.
export async function saveAccount(holderId: string, a: LinkedAccount) {
  if (!db) throw new Error("No database");
  await db.transaction((tx) => [
    tx`delete from holder_accounts where provider = ${a.provider} and account_id = ${a.accountId} and holder_id <> ${holderId}`,
    tx`insert into holder_accounts (holder_id, provider, account_id, name, roles) values (${holderId}, ${a.provider}, ${a.accountId}, ${a.name}, ${JSON.stringify(a.roles)})
       on conflict (holder_id, provider) do update set account_id = excluded.account_id, name = excluded.name, roles = excluded.roles, linked_at = now()`,
  ]);
}

export async function removeAccount(holderId: string, provider: Provider) {
  if (!db) return;
  await db`delete from holder_accounts where holder_id = ${holderId} and provider = ${provider}`;
}

// Marks a wallet login nonce as used. False if it was already used: that proof is a replay.
// Without the database the sealed flow cookie (deleted after one use) is the only guard.
export async function claimNonce(nonce: string, expiresAt: number): Promise<boolean> {
  if (!db) return true;
  const rows = await db`with purge as (delete from used_nonces where expires_at < now())
                       insert into used_nonces (nonce, expires_at) values (${nonce}, ${new Date(expiresAt).toISOString()}) on conflict do nothing returning nonce`;
  return rows.length === 1;
}

// The hot wallets that can log in for this vault wallet (the vault can remove them: DELETE /api/holder/wallets).
export async function hotsOf(vault: string): Promise<string[]> {
  if (!db) return [];
  const rows = await db`select hot from wallet_links where vault = ${vault} order by created_at limit 20`;
  return rows.map((r) => r.hot as string);
}

/* ------------------------------------------------------------ holder map (/holders/map) */

export const MAX_PINS = 10_000; // pins sent to the map page
export const PIN_MONTHS = 12; // a pin nobody has refreshed for this long stops showing (see renewPin)

// What the map sends to a logged-in holder. A pin with showIdentity off has no name, Lad, handle or date, even for
// its owner: the server never sends them, so they can't be read from the page, and the owner sees the dot others see.
export type MapPin = { id: number; lat: number; lng: number; city: string; country: string; you: boolean; name?: string; handle?: string; lad?: number; since?: string };
export type MapCity = { city: string; country: string; lat: number; lng: number; count: number };
export type MapData = { pins: MapPin[]; cities: MapCity[]; holders: number; cityCount: number; countryCount: number };
export type MyPin = { city: string; country: string; lat: number; lng: number; showIdentity: boolean };

export async function getMapData(viewer: string): Promise<MapData> {
  const empty: MapData = { pins: [], cities: [], holders: 0, cityCount: 0, countryCount: 0 };
  if (!db) return empty;
  // The name follows the same rule as everywhere else (applyAccounts): X handle, then Discord name, then the short wallet address.
  const rows = await db`
    select l.holder_id, l.city, l.country, l.lat, l.lng, l.show_identity,
           coalesce(s.photo, l.lad) as lad, s.since::text as since, x.name as x_name,
           case when x.name is not null then '@' || x.name
                when d.name is not null then d.name
                when l.holder_id like 'wallet:%' then left(substr(l.holder_id, 8), 4) || '…' || right(l.holder_id, 4)
                else 'MAD LAD' end as name
    from holder_locations l
    left join holder_settings s on s.holder_id = l.holder_id
    left join holder_accounts x on x.holder_id = l.holder_id and x.provider = 'x'
    left join holder_accounts d on d.holder_id = l.holder_id and d.provider = 'discord'
    where l.updated_at > now() - make_interval(months => ${PIN_MONTHS})
    order by l.updated_at desc
    limit ${MAX_PINS}`;
  const pins: MapPin[] = rows.map((r, id) => ({
    id,
    lat: r.lat as number,
    lng: r.lng as number,
    city: r.city as string,
    country: r.country as string,
    you: r.holder_id === viewer,
    ...(r.show_identity
      ? { name: r.name as string, handle: (r.x_name as string | null) ?? undefined, lad: (r.lad as number | null) ?? undefined, since: (r.since as string | null) ?? undefined }
      : {}),
  }));
  const byCity = new Map<string, MapCity>();
  for (const p of pins) {
    const k = `${p.city}|${p.country}|${p.lat}|${p.lng}`; // by place, so two cities with one name (Portland, US) stay apart
    const c = byCity.get(k);
    if (c) c.count++;
    else byCity.set(k, { city: p.city, country: p.country, lat: p.lat, lng: p.lng, count: 1 });
  }
  const cities = [...byCity.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  return { pins, cities, holders: pins.length, cityCount: cities.length, countryCount: new Set(pins.map((p) => p.country)).size };
}

export async function getMyPin(holderId: string): Promise<MyPin | null> {
  if (!db) return null;
  const rows = await db`select city, country, lat, lng, show_identity from holder_locations where holder_id = ${holderId}`;
  const r = rows[0];
  return r ? { city: r.city as string, country: r.country as string, lat: r.lat as number, lng: r.lng as number, showIdentity: r.show_identity as boolean } : null;
}

export async function savePin(holderId: string, pin: MyPin, lad: number | null) {
  if (!db) throw new Error("No database");
  await db`insert into holder_locations (holder_id, city, country, lat, lng, lad, show_identity)
           values (${holderId}, ${pin.city}, ${pin.country}, ${pin.lat}, ${pin.lng}, ${lad}, ${pin.showIdentity})
           on conflict (holder_id) do update set city = excluded.city, country = excluded.country, lat = excluded.lat,
             lng = excluded.lng, lad = excluded.lad, show_identity = excluded.show_identity, updated_at = now()`;
}

// A holder with a Lad showed up (the map or the holder area): their pin counts as fresh again. At most once a day, so most calls change nothing.
export async function renewPin(holderId: string) {
  if (!db) return;
  await db`update holder_locations set updated_at = now() where holder_id = ${holderId} and updated_at < now() - interval '1 day'`;
}

export async function removePin(holderId: string) {
  if (!db) return;
  await db`delete from holder_locations where holder_id = ${holderId}`;
}
