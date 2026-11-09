import { getSession, setSession, takeWalletFlow } from "@/lib/auth/session";
import { holderFromWallet, MAX_VAULTS, sameWalletMessage, signerOf, vaultsFullMessage, walletFail, walletRouteGuard } from "@/lib/auth/wallet";
import { claimNonce, linkVault } from "@/lib/db";

const lookupFailed = () => walletFail("lookup", "We couldn’t read your LADS from the blockchain. Please try again in a moment.", 502);

// POST /api/auth/wallet/verify { signedMessage, signature } or { signedTransaction } (base64) → checks
// what Backpack signed for the last challenge and logs in (or links the vault). See lib/auth/wallet.ts.
export async function POST(request: Request) {
  const blocked = walletRouteGuard(request, "wallet-verify", 20);
  if (blocked) return blocked;

  const flow = await takeWalletFlow();
  if (!flow) return walletFail("expired", "That took too long. Please try again.", 401);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const signer = await signerOf(flow, body);
  if (!signer) return walletFail("signature", "The signature didn’t check out. Please try again.", 401);
  // Each challenge can be answered once, whoever holds a copy of the cookie and the proof.
  if (!(await claimNonce(flow.signIn.nonce, flow.exp).catch(() => true))) return walletFail("used", "That signature was already used. Please try again.", 401);

  if (flow.purpose === "login") {
    try {
      const holder = await holderFromWallet(signer);
      await setSession(holder); // a real login: a new 8 hours
      return Response.json({ ok: true, lads: holder.lads.length });
    } catch (e) {
      console.error("[auth] wallet login failed:", (e as Error).message);
      return lookupFailed();
    }
  }

  const session = await getSession();
  if (!session?.wallet || session.wallet !== flow.hot) return walletFail("expired", "You’re no longer logged in with that wallet.", 401);
  if (signer === session.wallet) return walletFail("same", sameWalletMessage, 400);
  if (session.vaults?.includes(signer)) return walletFail("linked", "That wallet is already linked.", 400);
  if ((session.vaults?.length ?? 0) >= MAX_VAULTS) return walletFail("full", vaultsFullMessage, 400);
  try {
    await linkVault(signer, session.wallet);
    const holder = await holderFromWallet(session.wallet, true);
    await setSession(holder, session.exp); // the session's own expiry: linking isn't a new login
    return Response.json({ ok: true, lads: holder.lads.length });
  } catch (e) {
    console.error("[auth] vault link failed:", (e as Error).message);
    return lookupFailed();
  }
}
