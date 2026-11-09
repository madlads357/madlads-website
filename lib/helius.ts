// "Holder since" from the blockchain, with Helius (server-only). Needs HELIUS_API_KEY.
// For each wallet: list its Mad Lads (DAS searchAssets), then for each Lad find the newest
// transfer of that Lad *into* the wallet (getTransactionsForAddress, tokenTransfer filter).
// That is when the wallet got it; "holder since" is the earliest of those dates.
// Runs at login (lib/auth/wallet.ts, lib/auth/matrica.ts), cached a week in the database.
// Also: which Mad Lads a wallet holds (the wallet login) and a recent blockhash (the Ledger login).
// Any failure or timeout returns null: the profile then simply shows no date.
//
// Checked against the live API (Nov 2026): collection address, searchAssets { total, items[].id },
// getTransactionsForAddress { data: [{ blockTime }], paginationToken }.
const MADLADS_COLLECTION = "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w"; // Mad Lads verified collection
const MAX_LADS = 60; // whales: the earliest of 60 Lads is plenty, and keeps the login fast
const PARALLEL = 4; // stays under the free plan's request rate
const TIMEOUT_MS = 8000;

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

// "Mad Lads #1234" → 1234 (the on-chain name).
export const ladNumber = (name: string | undefined) => {
  const m = name?.match(/#\s?(\d{1,5})\b/);
  return m ? Number(m[1]) : null;
};

type Asset = { id: string; content?: { metadata?: { name?: string } } };

// The Mad Lads held by one wallet (staked Lads stay in the wallet, so they count too).
async function madLadAssets(owner: string, signal: AbortSignal, max = MAX_LADS): Promise<Asset[]> {
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

const madLadMints = async (owner: string, signal: AbortSignal) => (await madLadAssets(owner, signal)).map((a) => a.id);

// Every Mad Lad number held by these wallets, sorted. Throws if Helius fails: the login must not
// pretend someone holds nothing because the lookup broke.
export async function madLadsOf(wallets: string[], max = 500): Promise<number[]> {
  if (!process.env.HELIUS_API_KEY) throw new Error("HELIUS_API_KEY is not set");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const lists = await Promise.all(wallets.map((w) => madLadAssets(w, ctrl.signal, max)));
    const numbers = lists.flat().map((a) => ladNumber(a.content?.metadata?.name)).filter((n): n is number => n !== null);
    return [...new Set(numbers)].sort((a, b) => a - b).slice(0, max);
  } finally {
    clearTimeout(timer);
  }
}

// A recent blockhash, for the memo transaction Ledger users sign (never sent; wallets just want a real one).
export async function latestBlockhash(): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [{ commitment: "finalized" }], ctrl.signal);
    return r.value.blockhash;
  } finally {
    clearTimeout(timer);
  }
}

// When the wallet received this Lad (unix seconds), or null if not found.
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

// Earliest date (ISO, day precision) one of these wallets received a Mad Lad it still holds.
export async function holderSince(wallets: string[]): Promise<string | null> {
  if (!process.env.HELIUS_API_KEY || wallets.length === 0) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const held: { owner: string; mint: string }[] = [];
    for (const owner of wallets) {
      for (const mint of await madLadMints(owner, ctrl.signal)) held.push({ owner, mint });
      if (held.length >= MAX_LADS) break;
    }
    const times = (await inBatches(held.slice(0, MAX_LADS), PARALLEL, (h) => receivedAt(h.owner, h.mint, ctrl.signal).catch(() => null))).filter(
      (t): t is number => t !== null,
    );
    if (!times.length) return null;
    return new Date(Math.min(...times) * 1000).toISOString().slice(0, 10);
  } catch (e) {
    console.warn("[helius] holder since failed:", (e as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
