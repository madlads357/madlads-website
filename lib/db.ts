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
