// Link X (server-only), with OAuth 1.0a "Sign in with X":
//   1. request_token (our callback) → 2. the holder approves on X (oauth/authenticate) →
//   3. access_token (with the verifier) → the X account id and handle.
// X's OAuth endpoints are free on the pay-per-use plan; reading the profile (users/me) is a paid read.
// The access token reply has always carried user_id and screen_name, so normally no paid call is made.
// If it doesn't, we read users/me once (about $0.001; fails cleanly when the spend cap is $0).
// We keep the account, never the tokens: they're dropped (and invalidated if X allows it) right away.
//
// Settings (.env.example): X_API_KEY, X_API_SECRET (the app's API Key and Secret, "consumer keys").
// Register the callback <site>/api/accounts/x/callback in the X app's user authentication settings.
import { createHmac, randomBytes } from "node:crypto";
import type { LinkedAccount } from "@/lib/db";
import { accountsAvailable } from "./available";

const API = "https://api.x.com";
const TIMEOUT_MS = 8000;

const env = process.env;
export const xEnabled = () => !!(env.X_API_KEY && env.X_API_SECRET) && accountsAvailable();
const callbackUrl = (origin: string) => `${origin}/api/accounts/x/callback`;

export class XNeedsCredits extends Error {} // the handle needs a paid read and the app has no credits

/* ------------------------------------------------------------ OAuth 1.0a signing (HMAC-SHA1) */

// RFC 3986 percent-encoding, as OAuth 1.0a requires (encodeURIComponent leaves !*'() alone).
const enc = (s: string) => encodeURIComponent(s).replace(/[!*'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

type Signing = {
  method: "GET" | "POST";
  url: string; // without query string
  params?: Record<string, string>; // query or form body parameters (signed too)
  oauth?: Record<string, string>; // extra oauth_* fields: oauth_callback, oauth_token…
  consumerKey: string;
  consumerSecret: string;
  tokenSecret?: string;
};

function oauthSignature({ method, url, params = {}, oauth = {}, consumerSecret, tokenSecret = "" }: Signing & { oauth: Record<string, string> }) {
  const all = { ...params, ...oauth };
  const paramString = Object.keys(all)
    .map((k) => [enc(k), enc(all[k])] as const)
    .sort(([a, x], [b, y]) => (a === b ? (x < y ? -1 : 1) : a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const base = `${method}&${enc(url)}&${enc(paramString)}`;
  return createHmac("sha1", `${enc(consumerSecret)}&${enc(tokenSecret)}`).update(base).digest("base64");
}

function authorizationHeader(s: Signing): string {
  const oauth: Record<string, string> = {
    oauth_consumer_key: s.consumerKey,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: "1.0",
    ...s.oauth,
  };
  oauth.oauth_signature = oauthSignature({ ...s, oauth });
  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${enc(k)}="${enc(oauth[k])}"`)
      .join(", ")
  );
}

async function signedPost(path: string, oauth: Record<string, string>, tokenSecret = "", form: Record<string, string> = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authorizationHeader({ method: "POST", url, params: form, oauth, consumerKey: env.X_API_KEY!, consumerSecret: env.X_API_SECRET!, tokenSecret }),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  return { status: res.status, text: await res.text() };
}

/* ------------------------------------------------------------ the flow */

// Step 1: a request token for this link, and where to send the holder.
export async function startLink(origin: string): Promise<{ token: string; secret: string; url: string }> {
  const r = await signedPost("/oauth/request_token", { oauth_callback: callbackUrl(origin) });
  const q = new URLSearchParams(r.text);
  const token = q.get("oauth_token");
  const secret = q.get("oauth_token_secret");
  if (r.status !== 200 || !token || !secret || q.get("oauth_callback_confirmed") !== "true") throw new Error(`X request_token ${r.status}: ${r.text.slice(0, 200)}`);
  return { token, secret, url: `${API}/oauth/authenticate?oauth_token=${encodeURIComponent(token)}` };
}

// Step 3: the holder approved; swap the verifier for the account.
export async function finishLink(token: string, tokenSecret: string, verifier: string): Promise<LinkedAccount> {
  const r = await signedPost("/oauth/access_token", { oauth_token: token }, tokenSecret, { oauth_verifier: verifier });
  const q = new URLSearchParams(r.text);
  const userToken = q.get("oauth_token");
  const userSecret = q.get("oauth_token_secret");
  if (r.status !== 200 || !userToken || !userSecret) throw new Error(`X access_token ${r.status}: ${r.text.slice(0, 200)}`);

  try {
    let id = q.get("user_id");
    let handle = q.get("screen_name");
    if (!id || !handle) ({ id, handle } = await usersMe(userToken, userSecret)); // paid read, only if needed
    return { provider: "x", accountId: id, name: handle, roles: [] };
  } finally {
    // We don't keep the token. Ask X to invalidate it (awaited, errors ignored: serverless hosting can stop
    // the function once the response is sent); if X doesn't allow it, the token simply goes unused.
    await signedPost("/1.1/oauth/invalidate_token", { oauth_token: userToken }, userSecret).catch(() => {});
  }
}

async function usersMe(token: string, secret: string): Promise<{ id: string; handle: string }> {
  const url = `${API}/2/users/me`;
  const res = await fetch(url, {
    headers: { Authorization: authorizationHeader({ method: "GET", url, oauth: { oauth_token: token }, consumerKey: env.X_API_KEY!, consumerSecret: env.X_API_SECRET!, tokenSecret: secret }) },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { data?: { id: string; username: string }; title?: string; detail?: string } | null;
  if (res.status === 402 || /credit|spend|payment|billing/i.test(`${json?.title} ${json?.detail}`)) throw new XNeedsCredits(json?.detail ?? "X credits needed");
  if (!res.ok || !json?.data) throw new Error(`X users/me ${res.status}: ${json?.detail ?? ""}`);
  return { id: json.data.id, handle: json.data.username };
}
