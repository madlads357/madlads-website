// Encrypted cookies for the holder login. Server-only.
// No database: the cookie itself holds the session, sealed with AES-256-GCM so it can't be read or edited.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sessionSecret } from "./config";
import { HINT, type HeaderHint } from "./hint";

export type HolderSession = {
  id: string; // "wallet:<address>" (or the Matrica user id): the key for the holder's saved settings and share link
  name: string; // short wallet address (or the Matrica username)
  lads: number[]; // Mad Lad numbers held in the wallet and its linked vaults (or the wallets linked to Matrica)
  wallet?: string; // wallet login: the address that logged in
  vaults?: string[]; // wallet login: vault wallets linked to it (their LADS count too)
  handle?: string; // X handle, for the passport (linked X account, or Matrica)
  discord?: string; // linked Discord account's name (its stamp roles are in `roles`)
  since?: string; // "holder since" date, ISO (from Helius, cached in the database)
  roles?: string[]; // Mad Lads Discord roles that earn a passport stamp (at most two)
  photo?: number; // the Lad chosen as passport photo (saved in the database)
  exp: number; // expiry, ms since epoch
};

// Short-lived state kept between "go to Matrica" and "back from Matrica".
export type LoginFlow = { verifier: string; state: string };

// Short-lived state kept between "here is what to sign" and "here is the signature" (wallet login).
// purpose "login": log in with the wallet that signs; "link": the wallet that signs (a vault) lets
// `hot`, the logged-in wallet, act for it. signIn: the Sign In With Solana fields the wallet must sign.
// memo: Ledger fallback, the transaction `payer` must sign carries `text`.
export type WalletFlow = {
  purpose: "login" | "link";
  hot?: string;
  signIn: { domain: string; uri: string; statement: string; nonce: string; issuedAt: string; expirationTime: string };
  memo?: { payer: string; text: string };
  exp: number;
};

const SESSION = "ml_session";
const FLOW = "ml_login";
const WALLET_FLOW = "ml_wallet";
const ACCOUNT_FLOW = "ml_link";
const SESSION_HOURS = 8;
export const MAX_LADS = 500; // keeps the cookie under the browser's 4 KB limit

const key = () => createHash("sha256").update(sessionSecret()).digest();

function seal(data: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null; // tampered, expired key or old format: treat as logged out
  }
}

const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

export async function getSession(): Promise<HolderSession | null> {
  const s = unseal<HolderSession>((await cookies()).get(SESSION)?.value);
  return s && s.exp > Date.now() && s.id ? s : null; // sessions from before holder ids: log in again
}

export async function setSession(s: Omit<HolderSession, "exp">) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const store = await cookies();
  store.set(SESSION, seal({ ...s, lads: s.lads.slice(0, MAX_LADS), exp }), { ...base, maxAge: SESSION_HOURS * 3600 });
  // Readable by the page (not httpOnly): only what the header shows, so pages stay prebuilt.
  // It proves nothing: the holder area always checks the encrypted session above.
  const hint: HeaderHint = { name: s.name, lad: s.photo ?? s.lads[0] ?? null };
  store.set(HINT, JSON.stringify(hint), { ...base, httpOnly: false, maxAge: SESSION_HOURS * 3600 }); // Next encodes the value
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION);
  store.delete(HINT);
}

export async function setLoginFlow(flow: LoginFlow) {
  (await cookies()).set(FLOW, seal(flow), { ...base, maxAge: 600 }); // 10 minutes to finish logging in
}

export async function takeLoginFlow(): Promise<LoginFlow | null> {
  const store = await cookies();
  const flow = unseal<LoginFlow>(store.get(FLOW)?.value);
  store.delete(FLOW); // one use only
  return flow;
}

export const randomState = () => randomBytes(16).toString("base64url");

export async function setWalletFlow(flow: WalletFlow) {
  (await cookies()).set(WALLET_FLOW, seal(flow), { ...base, maxAge: 300 }); // 5 minutes to sign
}

export async function takeWalletFlow(): Promise<WalletFlow | null> {
  const store = await cookies();
  const flow = unseal<WalletFlow>(store.get(WALLET_FLOW)?.value);
  store.delete(WALLET_FLOW); // one use only: a signature can't be replayed
  return flow && flow.exp > Date.now() ? flow : null;
}

// Linking an account (Discord, X): the state sent to the provider, checked when it sends the holder back.
// X (OAuth 1.0a): state is the request token, secret its token secret (needed to finish the link).
export type AccountFlow = { provider: "discord" | "x"; state: string; secret?: string; holderId: string; exp: number };

export async function setAccountFlow(flow: AccountFlow) {
  (await cookies()).set(ACCOUNT_FLOW, seal(flow), { ...base, maxAge: 600 }); // 10 minutes to finish
}

export async function takeAccountFlow(): Promise<AccountFlow | null> {
  const store = await cookies();
  const flow = unseal<AccountFlow>(store.get(ACCOUNT_FLOW)?.value);
  store.delete(ACCOUNT_FLOW); // one use only
  return flow && flow.exp > Date.now() ? flow : null;
}
