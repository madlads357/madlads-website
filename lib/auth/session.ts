// Encrypted cookies for the holder login. Server-only.
// No database: the cookie itself holds the session, sealed with AES-256-GCM so it can't be read or edited.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { sessionSecret } from "./config";

export type HolderSession = {
  name: string; // Matrica username
  avatar?: string; // Matrica profile picture
  lads: number[]; // Mad Lad numbers held in the wallets linked to Matrica
  exp: number; // expiry, ms since epoch
};

// Short-lived state kept between "go to Matrica" and "back from Matrica".
export type LoginFlow = { verifier: string; state: string };

const SESSION = "ml_session";
const FLOW = "ml_login";
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
  return s && s.exp > Date.now() ? s : null;
}

export async function setSession(s: Omit<HolderSession, "exp">) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  (await cookies()).set(SESSION, seal({ ...s, lads: s.lads.slice(0, MAX_LADS), exp }), { ...base, maxAge: SESSION_HOURS * 3600 });
}

export async function clearSession() {
  (await cookies()).delete(SESSION);
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
