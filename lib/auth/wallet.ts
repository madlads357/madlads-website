// Login with Backpack (server-only). Sign In With Solana, checked here:
//   1. challenge: we return the sign-in fields (domain, statement, nonce, dates) and keep them in a
//      sealed cookie (5 minutes, one use). The wallet builds the SIWS message from them and signs it
//      (solana:signIn; a Ledger signs it as an offchain message). Fallback for a Ledger whose wallet
//      can't do that: a memo transaction carrying the nonce, signed but never sent.
//   2. verify: we check the signature and that the signed fields are ours, then read the LADS the
//      wallet holds (Helius) and open the session.
// Vault links: a vault wallet (cold, often a Ledger) signs once to let a hot wallet log in for it.
// Logging in with the hot wallet then counts the vault's LADS too (table wallet_links).
//
// "Backpack only" is what the login button offers. The signature proves who owns the address, not
// which wallet app signed it, and that is all the holder area needs.
import { randomBytes } from "node:crypto";
import { type HolderSession, type WalletFlow, MAX_LADS } from "./session";
import { isSolanaAddress, memoTransaction, readSignIn, signedMemo } from "./solana";
import { authMode } from "./config";
import { shortAddress } from "./hint";
import { holdingsOf, latestBlockhash, sinceOfHeld } from "@/lib/helius";
import { accountsOf, getSettings, MAX_VAULTS, saveSince, vaultsOf } from "@/lib/db";
import { applyAccounts } from "@/lib/accounts/apply";
import { rateLimit } from "@/lib/rate-limit";

const WEEK_MS = 7 * 86_400_000;
const FLOW_MS = 5 * 60_000;
export { MAX_VAULTS };

// The answers both wallet routes (challenge, verify) give.
export const walletFail = (error: string, message: string, status: number) => Response.json({ error, message }, { status });
export const vaultsFullMessage = `You can link up to ${MAX_VAULTS} wallets.`;
export const sameWalletMessage = "That’s the wallet you’re logged in with. Switch to your vault wallet in Backpack, then sign again.";

// What both wallet routes check first: wallet login on, a request from our own pages, not too many tries.
export function walletRouteGuard(request: Request, bucket: string, max: number): Response | null {
  if (authMode() !== "wallet") return Response.json({ error: "Wallet login is off" }, { status: 404 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Wrong origin" }, { status: 403 });
  if (!rateLimit(request, bucket, max)) return walletFail("slow", "Too many attempts. Please wait a minute and try again.", 429);
  return null;
}

// What the browser passes to the wallet's signIn (SolanaSignInInput), or the Ledger fallback transaction.
export type Challenge =
  | { signIn: { domain: string; statement: string; uri: string; version: "1"; chainId: "mainnet"; nonce: string; issuedAt: string; expirationTime: string } }
  | { transaction: string }; // base64 wire transaction

// origin: the site the visitor is on (e.g. https://madlads.com). The wallet checks the domain against
// the page asking, so a sign-in requested by another site can't be used here.
// memoPayer: Ledger fallback, the address that signs the memo transaction.
export async function challenge(
  origin: string,
  purpose: WalletFlow["purpose"],
  hot?: string, // purpose "link": the logged-in wallet the vault lets in
  memoPayer?: string,
): Promise<{ flow: WalletFlow; challenge: Challenge }> {
  const domain = new URL(origin).host;
  const nonce = randomBytes(12).toString("hex"); // SIWS nonces are alphanumeric
  const now = Date.now();
  const statement =
    purpose === "login"
      ? "Log in to the MAD LADS holder area. Signing is free: no transaction, no fees."
      : `Let ${hot} log in to the MAD LADS holder area for this wallet, so its LADS count too. Signing is free. You can remove the link anytime in the holder area, from either wallet.`;
  const signIn = { domain, uri: origin, statement, nonce, issuedAt: new Date(now).toISOString(), expirationTime: new Date(now + FLOW_MS).toISOString() };
  const flow: WalletFlow = { purpose, hot, signIn, exp: now + FLOW_MS };

  if (memoPayer) {
    if (!isSolanaAddress(memoPayer)) throw new Error("Not a Solana address");
    const text = purpose === "login" ? `${domain} login ${nonce}` : `${domain} link ${hot} ${nonce}`;
    flow.memo = { payer: memoPayer, text };
    return { flow, challenge: { transaction: memoTransaction(memoPayer, text, await latestBlockhash()) } };
  }
  return { flow, challenge: { signIn: { ...signIn, version: "1", chainId: "mainnet" } } };
}

const bytes = (v: unknown) => (typeof v === "string" && v.length < 8000 ? new Uint8Array(Buffer.from(v, "base64")) : null);

// The address that signed this flow's challenge, or null. Body: { signedMessage, signature } (sign-in,
// base64) or { signedTransaction } (Ledger fallback, base64).
export async function signerOf(flow: WalletFlow, body: { signedMessage?: unknown; signature?: unknown; signedTransaction?: unknown }): Promise<string | null> {
  if (flow.memo) {
    const tx = bytes(body.signedTransaction);
    return tx && (await signedMemo(tx, flow.memo.payer as Parameters<typeof signedMemo>[1], flow.memo.text)) ? flow.memo.payer : null;
  }
  const message = bytes(body.signedMessage);
  const signature = bytes(body.signature);
  if (!message || !signature) return null;
  const f = await readSignIn(message, signature);
  if (!f) return null;
  // The wallet built the message: every field it shows must be ours. The nonce (one use) stops
  // replays, the domain stops other sites, the statement says what is being allowed (a vault link).
  const want = flow.signIn;
  if (f.domain !== want.domain || f.nonce !== want.nonce) return null;
  if (f.statement !== want.statement) return null;
  if (f.uri !== undefined && f.uri !== want.uri) return null;
  if (f.chainId !== undefined && !["mainnet", "solana:mainnet"].includes(f.chainId)) return null;
  if (f.expirationTime && Date.parse(f.expirationTime) < Date.now()) return null;
  if (f.notBefore && Date.parse(f.notBefore) > Date.now()) return null;
  return f.address;
}

// The session for a wallet: its LADS and those of its linked vaults, plus saved settings.
// recheck: the linked wallets just changed, so work "MAD since" out again.
export async function holderFromWallet(address: string, recheck = false): Promise<Omit<HolderSession, "exp">> {
  const id = `wallet:${address}`;
  // Three independent reads at once. vaultsOf throws if the database is down: better no login than
  // silently missing a vault's LADS (the saved settings and linked accounts are nice to have).
  const [vaults, settings, accounts] = await Promise.all([vaultsOf(address), getSettings(id).catch(() => null), accountsOf(id).catch(() => [])]);
  const { lads, held } = await holdingsOf([address, ...vaults], MAX_LADS);

  // "MAD since" from the blockchain, saved in the database and only worked out again after a week
  // (or right away when the linked wallets change).
  let since = settings?.since ?? undefined;
  const fresh = settings?.sinceCheckedAt && Date.now() - new Date(settings.sinceCheckedAt).getTime() < WEEK_MS;
  if (lads.length && (recheck || !fresh)) {
    try {
      const found = await sinceOfHeld(held); // reuses the Lads already read: no second round of lookups
      since = found ?? undefined;
      await saveSince(id, found).catch(() => {});
    } catch (e) {
      // Helius hiccup: keep the date we had and try again at the next login (nothing saved, so not "fresh").
      console.warn("[wallet] could not work out MAD since:", (e as Error).message);
    }
  }

  // Linked Discord / X: name, handle and stamps
  return applyAccounts(
    {
      id,
      name: shortAddress(address),
      wallet: address,
      vaults,
      lads,
      since,
      photo: settings?.photo && lads.includes(settings.photo) ? settings.photo : undefined,
    },
    accounts,
  );
}
