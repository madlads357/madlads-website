// Backpack in the browser, with Solana Kit's wallet plugin (@solana/kit-plugin-wallet: Wallet Standard
// discovery, connect, Sign In With Solana). The filter keeps Backpack only: the login is Backpack-only.
// The server half is lib/auth/wallet.ts.
//
// How a holder proves the wallet is theirs, best first:
//   Normal account:
//   1. solana:signIn (Sign In With Solana), wrapped in an offchain message when Backpack supports it.
//   2. Backpack without solana:signIn: the same sign-in text, through solana:signMessage.
//   Ledger ("I use a Ledger"): a memo transaction carrying the challenge, approved on the device and
//   never sent. The most reliable thing a Ledger signs, whatever its Solana app version.
//   The site can't pick the Ledger: Backpack signs with the account selected in Backpack.
import {
  createClient,
  getBase64Decoder,
  getBase64Encoder,
  getTransactionDecoder,
  getTransactionEncoder,
  getUtf8Encoder,
  assertIsTransactionWithinSizeLimit,
  isTransactionModifyingSigner,
  isTransactionPartialSigner,
  type Transaction,
} from "@solana/kit";
import { supportsSignInWithOffchainMessage, walletSigner } from "@solana/kit-plugin-wallet";
import { signInText } from "@/lib/auth/siws";
import type { Challenge } from "@/lib/auth/wallet";

const BACKPACK = "Backpack";
export const BACKPACK_DOWNLOAD = "https://backpack.app/download";

// One client for the site. Nothing is sent from the browser, so no RPC plugin; no remembered wallet
// (storage: null): every login asks Backpack, which also picks up an account switch for vault links.
export const walletClient = createClient().use(
  walletSigner({ chain: "solana:mainnet", filter: (w) => w.name === BACKPACK, storage: null, autoConnect: false }),
);
type WalletClient = typeof walletClient;
type UiWallet = ReturnType<WalletClient["wallet"]["getState"]>["wallets"][number];

// Backpack, if this browser has it (the extension, or the Backpack app's built-in browser).
// Wallets announce themselves right after the page loads, so wait a moment for it.
export function findBackpack(timeoutMs = 1500): Promise<UiWallet | null> {
  const now = walletClient.wallet.getState().wallets[0];
  if (now) return Promise.resolve(now);
  return new Promise((resolve) => {
    const stop = walletClient.wallet.subscribe(() => {
      const w = walletClient.wallet.getState().wallets[0];
      if (w) done(w);
    });
    const timer = setTimeout(() => done(null), timeoutMs);
    function done(w: UiWallet | null) {
      clearTimeout(timer);
      stop();
      resolve(w);
    }
  });
}

export const isPhone = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Phones have no extensions: this opens the current page inside the Backpack app's browser.
// TODO (first test on a phone): confirm Backpack's universal-link format.
export const openInBackpackApp = () =>
  `https://backpack.app/ul/v1/browse/${encodeURIComponent(location.href)}?ref=${encodeURIComponent(location.origin)}`;

export class WalletError extends Error {
  constructor(
    message: string,
    public kind: "missing" | "cancelled" | "server" = "server",
  ) {
    super(message);
  }
}

const cancelled = (e: unknown) => {
  const err = e as { name?: string; code?: number; message?: string };
  return err?.name === "AbortError" || err?.code === 4001 || /reject|cancel|denied|declin|closed/i.test(err?.message ?? "");
};

const b64 = (bytes: Uint8Array) => getBase64Decoder().decode(bytes); // bytes → base64 text
const fromB64 = (text: string) => getBase64Encoder().encode(text); // base64 text → bytes

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) throw new WalletError(json.message ?? json.error ?? "Something went wrong. Please try again.");
  return json;
}

// The address Backpack has selected right now, after connecting.
async function connectedAddress(wallet: UiWallet): Promise<string> {
  await walletClient.wallet.connect(wallet);
  const connected = walletClient.wallet.getState().connected;
  if (!connected) throw new WalletError("Backpack didn’t share a Solana wallet. Unlock Backpack and try again.");
  return connected.account.address;
}

// Ledger fallback: sign the memo transaction with the connected account. Never sent.
async function signMemoTransaction(transaction: string): Promise<string> {
  const connected = walletClient.wallet.getState().connected;
  const signer = connected?.signer;
  if (!signer || !connected.supportedTransactionVersions.has("legacy")) throw new WalletError("This version of Backpack can’t sign transactions. Update Backpack and try again.");
  const tx = getTransactionDecoder().decode(fromB64(transaction));
  assertIsTransactionWithinSizeLimit(tx);
  // It also has a lifetime (the server set a recent blockhash), which the type can't see after decoding.
  const ready = tx as Parameters<Extract<typeof signer, { signTransactions: unknown }>["signTransactions"]>[0][number];
  let signed: Transaction;
  if (isTransactionModifyingSigner(signer)) {
    [signed] = await signer.modifyAndSignTransactions([ready]);
  } else if (isTransactionPartialSigner(signer)) {
    const [signatures] = await signer.signTransactions([ready]);
    signed = { ...tx, signatures: { ...tx.signatures, ...signatures } };
  } else {
    throw new WalletError("This version of Backpack can’t sign transactions. Update Backpack and try again.");
  }
  return b64(new Uint8Array(getTransactionEncoder().encode(signed)));
}

export type Step = "connect" | "sign" | "check";

// The whole login (or vault link): get the challenge → sign in Backpack → send it back to be checked.
// ledger: the holder ticked "I use a Ledger": sign the memo transaction on the device.
export async function signInWithBackpack(purpose: "login" | "link", ledger = false, onStep: (s: Step) => void = () => {}) {
  const wallet = await findBackpack();
  if (!wallet) throw new WalletError("Backpack isn’t installed in this browser.", "missing");
  const hasSignIn = wallet.features.includes("solana:signIn");
  const offchainSignIn = supportsSignInWithOffchainMessage(wallet);
  try {
    let proof: { signedMessage: string; signature: string } | { signedTransaction: string };

    if (ledger) {
      // Ledger: the transaction names its payer, so connect first.
      onStep("connect");
      const memoPayer = await connectedAddress(wallet);
      const c = await post<Challenge>("/api/auth/wallet/challenge", { purpose, memoPayer });
      if (!("transaction" in c)) throw new WalletError("Something went wrong. Please try again.");
      onStep("sign");
      proof = { signedTransaction: await signMemoTransaction(c.transaction) };
    } else if (hasSignIn) {
      // 1. Sign In With Solana: connect and sign in one Backpack prompt.
      const c = await post<Challenge>("/api/auth/wallet/challenge", { purpose });
      if (!("signIn" in c)) throw new WalletError("Something went wrong. Please try again.");
      onStep("sign");
      const out = await walletClient.wallet.signIn(wallet, { ...c.signIn, ...(offchainSignIn && { useOffchainMessage: { messageVersion: 1 as const } }) });
      proof = { signedMessage: b64(new Uint8Array(out.signedMessage)), signature: b64(new Uint8Array(out.signature)) };
    } else {
      // 2. No solana:signIn: build the same Sign In With Solana text and sign it as a message.
      onStep("connect");
      const address = await connectedAddress(wallet);
      const c = await post<Challenge>("/api/auth/wallet/challenge", { purpose });
      if (!("signIn" in c)) throw new WalletError("Something went wrong. Please try again.");
      onStep("sign");
      const message = getUtf8Encoder().encode(signInText({ ...c.signIn, address }));
      const signature = await walletClient.wallet.signMessage(message);
      proof = { signedMessage: b64(new Uint8Array(message)), signature: b64(new Uint8Array(signature)) };
    }

    onStep("check");
    return await post<{ ok: true; lads: number }>("/api/auth/wallet/verify", proof);
  } catch (e) {
    if (e instanceof WalletError) throw e;
    if (cancelled(e)) throw new WalletError("Cancelled in Backpack.", "cancelled");
    console.warn("[wallet]", e);
    throw new WalletError(
      ledger
        ? "The Ledger didn’t sign. Check it’s plugged in, unlocked and on the Solana app, and that your Ledger account is selected in Backpack."
        : "Backpack couldn’t sign. Using a Ledger account? Tick “I use a Ledger” and try again.",
    );
  } finally {
    // Nothing stays connected: the site never asks the wallet for anything else.
    walletClient.wallet.disconnect().catch(() => {});
  }
}
