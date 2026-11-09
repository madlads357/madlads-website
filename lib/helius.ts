// What the blockchain says about a holder, with Helius (server-only). Needs HELIUS_API_KEY.
//   holdingsOf(wallets)   the Mad Lads these wallets hold (DAS searchAssets)
//   sinceOfHeld(held)     "holder since": for each Lad, the newest transfer of it *into* its wallet
//                         (getTransactionsForAddress, tokenTransfer filter) is when the wallet got it;
//                         the earliest of those dates is "since"
//   latestBlockhash()     a recent blockhash for the memo transaction Ledger users sign (never sent)
// Runs at login (lib/auth/wallet.ts, lib/auth/matrica.ts); "since" is cached a week in the database.
//
// Every lookup throws when Helius fails or times out, instead of answering "nothing": a login must not
// pretend someone holds no Lads, and a hiccup must not erase a saved "since" date. Callers decide.
//
// Checked against the live API (Nov 2026): collection address, searchAssets { total, items[].id },
// getTransactionsForAddress { data: [{ blockTime }], paginationToken }.
const MADLADS_COLLECTION = "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w"; // Mad Lads verified collection
const SINCE_LADS = 60; // whales: the earliest of 60 Lads is plenty, and keeps the login fast
const PARALLEL = 4; // stays under the free plan's request rate
const TIMEOUT_MS = 8000;
const BLOCKHASH_TTL_MS = 30_000;

type RpcResult<T> = { result?: T; error?: { message: string } };

async function rpc<T>(method: string, params: unknown, signal: AbortSignal): Promise<T> {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "madlads", method, params }),
    signal,
    cache: "no-store",
  });
  const json = (await res.json()) as RpcResult<T>;
  if (!res.ok || json.error || json.result === undefined) throw new Error(json.error?.message ?? `Helius ${res.status}`);
  return json.result;
}

// Runs `fn` with an abort signal that fires after the time budget.
async function withBudget<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (!process.env.HELIUS_API_KEY) throw new Error("HELIUS_API_KEY is not set");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

// "Mad Lads #1234" → 1234 (the on-chain name).
export const ladNumber = (name: string | undefined) => {
  const m = name?.match(/#\s?(\d{1,5})\b/);
  return m ? Number(m[1]) : null;
};

type Asset = { id: string; content?: { metadata?: { name?: string } } };
export type Held = { owner: string; mint: string };
export type Holdings = { lads: number[]; held: Held[] };

// The Mad Lads held by one wallet (staked Lads stay in the wallet, so they count too).
async function madLadAssets(owner: string, signal: AbortSignal, max: number): Promise<Asset[]> {
  const items: Asset[] = [];
  for (let page = 1; page <= 10 && items.length < max; page++) {
    const r = await rpc<{ total: number; items: Asset[] }>(
      "searchAssets",
      { ownerAddress: owner, tokenType: "regularNft", grouping: ["collection", MADLADS_COLLECTION], page, limit: 1000 },
      signal,
    );
    items.push(...r.items);
    if (r.items.length < 1000) break;
  }
  return items;
}

// Every Mad Lad these wallets hold: the numbers (sorted, at most `max`) and which wallet holds which mint.
// The wallets are read in parallel, once: "since" reuses `held` instead of asking again.
export async function holdingsOf(wallets: string[], max = 500): Promise<Holdings> {
  return withBudget(async (signal) => {
    const lists = await Promise.all(wallets.map(async (owner) => (await madLadAssets(owner, signal, max)).map((a) => ({ owner, asset: a }))));
    const all = lists.flat();
    const numbers = all.map((x) => ladNumber(x.asset.content?.metadata?.name)).filter((n): n is number => n !== null);
    return {
      lads: [...new Set(numbers)].sort((a, b) => a - b).slice(0, max),
      held: all.map((x) => ({ owner: x.owner, mint: x.asset.id })),
    };
  });
}

// A recent blockhash for the Ledger memo transaction. The wallet only needs a real one to show the
// transaction, so one fetched in the last 30 seconds will do: this keeps a loop of challenge requests
// from turning into a loop of Helius calls.
let blockhash: { value: string; at: number } | null = null;
export async function latestBlockhash(): Promise<string> {
  if (blockhash && Date.now() - blockhash.at < BLOCKHASH_TTL_MS) return blockhash.value;
  const value = await withBudget(async (signal) => (await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [{ commitment: "finalized" }], signal)).value.blockhash);
  blockhash = { value, at: Date.now() };
  return value;
}

// When the wallet received this Lad (unix seconds), or null if there is no transfer into it.
async function receivedAt(owner: string, mint: string, signal: AbortSignal): Promise<number | null> {
  const r = await rpc<{ data?: { blockTime?: number }[] } | { blockTime?: number }[]>(
    "getTransactionsForAddress",
    [owner, { transactionDetails: "signatures", sortOrder: "desc", limit: 1, filters: { tokenTransfer: { mint, direction: "in" } } }],
    signal,
  );
  const list = Array.isArray(r) ? r : (r.data ?? []);
  return list[0]?.blockTime ?? null;
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

// Earliest date (ISO, day precision) the holder's wallets received a Lad they still hold.
// null: the lookup worked and found no transfer (no date to show). Throws if it did not work, or only
// partly (a missing Lad could hide the real earliest date).
export async function sinceOfHeld(held: Held[]): Promise<string | null> {
  if (held.length === 0) return null;
  return withBudget(async (signal) => {
    const times = await inBatches(held.slice(0, SINCE_LADS), PARALLEL, (h) => receivedAt(h.owner, h.mint, signal));
    const found = times.filter((t): t is number => t !== null);
    return found.length ? new Date(Math.min(...found) * 1000).toISOString().slice(0, 10) : null;
  });
}

// The same from wallet addresses only (the Matrica login has no holdings yet).
export async function holderSince(wallets: string[]): Promise<string | null> {
  if (wallets.length === 0) return null;
  return sinceOfHeld((await holdingsOf(wallets, SINCE_LADS)).held);
}
