// Encrypted cookies for the holder login. Server-only.
// No database: the cookie itself holds the session, sealed with AES-256-GCM so it can't be read or edited.
// Each kind of cookie (session, login flow, wallet flow, link flow) is sealed for its own purpose, so one
// kind can never be passed off as another.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sessionSecret } from "./config";
import { HINT, type HeaderHint } from "./hint";
import { packLads, unpackLads } from "./lads-pack";

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
export const MAX_LADS = 500; // the Lads are packed (lads-pack.ts): 500 of them still leave the cookie around 2.5 KB, under the 4 KB limit

const key = () => createHash("sha256").update(sessionSecret()).digest();

function seal(data: unknown, purpose: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(purpose)); // authenticated, not encrypted: opening it for another purpose fails
  const body = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

function unseal<T>(value: string | undefined, purpose: string): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    decipher.setAAD(Buffer.from(purpose));
    return JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null; // tampered, expired key or old format: treat as logged out
  }
}

const base = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

type Sealed = Omit<HolderSession, "lads"> & { l: string }; // the Lads, packed

export async function getSession(): Promise<HolderSession | null> {
  const { l, ...rest } = unseal<Sealed>((await cookies()).get(SESSION)?.value, SESSION) ?? ({} as Partial<Sealed>);
  const s = { ...rest, lads: unpackLads(l ?? "") } as HolderSession;
  return s.exp > Date.now() && s.id ? s : null; // sessions from before holder ids: log in again
}

// exp: keep the session's current expiry. Only a real login (a wallet signature) starts a new 8 hours:
// linking an account, choosing a photo or unlinking must not stretch a session that was never re-verified.
export async function setSession(s: Omit<HolderSession, "exp">, exp = Date.now() + SESSION_HOURS * 3600_000) {
  const maxAge = Math.max(1, Math.floor((exp - Date.now()) / 1000));
  const store = await cookies();
  const { lads, ...rest } = s;
  store.set(SESSION, seal({ ...rest, l: packLads(lads.slice(0, MAX_LADS)), exp } satisfies Sealed, SESSION), { ...base, maxAge });
  // Readable by the page (not httpOnly): only what the header shows, so pages stay prebuilt.
  // It proves nothing: the holder area always checks the encrypted session above.
  const hint: HeaderHint = { name: s.name, lad: s.photo ?? s.lads[0] ?? null };
  store.set(HINT, JSON.stringify(hint), { ...base, httpOnly: false, maxAge }); // Next encodes the value
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION);
  store.delete(HINT);
}

// The short-lived flow cookies (log in with Matrica, sign a wallet challenge, link an account): one sealed
// cookie each, deleted as soon as it is read ("one use only"), and ignored once its `exp` has passed.
async function setFlow(name: string, flow: object, maxAge: number) {
  (await cookies()).set(name, seal(flow, name), { ...base, maxAge });
}

async function takeFlow<T extends object>(name: string): Promise<T | null> {
  const store = await cookies();
  const flow = unseal<T>(store.get(name)?.value, name);
  store.delete(name);
  const exp = (flow as { exp?: number } | null)?.exp;
  return flow && (exp === undefined || exp > Date.now()) ? flow : null;
}

export const randomState = () => randomBytes(16).toString("base64url");

export const setLoginFlow = (flow: LoginFlow) => setFlow(FLOW, flow, 600); // 10 minutes to finish logging in
export const takeLoginFlow = () => takeFlow<LoginFlow>(FLOW);

// The wallet nonce is also recorded server-side (claimNonce in lib/db.ts): the cookie alone can be copied.
export const setWalletFlow = (flow: WalletFlow) => setFlow(WALLET_FLOW, flow, 300); // 5 minutes to sign
export const takeWalletFlow = () => takeFlow<WalletFlow>(WALLET_FLOW);

// Linking an account (Discord, X): the state sent to the provider, checked when it sends the holder back.
// X (OAuth 1.0a): state is the request token, secret its token secret (needed to finish the link).
export type AccountFlow = { provider: "discord" | "x"; state: string; secret?: string; holderId: string; exp: number };
export const setAccountFlow = (flow: AccountFlow) => setFlow(ACCOUNT_FLOW, flow, 600); // 10 minutes to finish
export const takeAccountFlow = () => takeFlow<AccountFlow>(ACCOUNT_FLOW);
