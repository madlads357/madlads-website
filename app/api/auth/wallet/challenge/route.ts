import { getSession, setWalletFlow } from "@/lib/auth/session";
import { isSolanaAddress } from "@/lib/auth/solana";
import { challenge, MAX_VAULTS, sameWalletMessage, vaultsFullMessage, walletFail, walletRouteGuard } from "@/lib/auth/wallet";
import { db } from "@/lib/db";

// POST /api/auth/wallet/challenge { purpose: "login" | "link", memoPayer? } → what Backpack signs:
// { signIn } (Sign In With Solana fields) or, with memoPayer (Ledger fallback), { transaction } (base64).
// See lib/auth/wallet.ts.
export async function POST(request: Request) {
  const blocked = walletRouteGuard(request, "wallet-challenge", 30);
  if (blocked) return blocked;

  const body = (await request.json().catch(() => ({}))) as { purpose?: unknown; memoPayer?: unknown };
  const purpose = body.purpose === "link" ? "link" : "login";
  if (body.memoPayer !== undefined && !isSolanaAddress(body.memoPayer)) return Response.json({ error: "Not a Solana address" }, { status: 400 });

  let hot: string | undefined;
  if (purpose === "link") {
    const session = await getSession();
    if (!session?.wallet) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!db) return Response.json({ error: "Linking wallets needs the database" }, { status: 503 });
    if ((session.vaults?.length ?? 0) >= MAX_VAULTS) return walletFail("full", vaultsFullMessage, 400);
    if (body.memoPayer === session.wallet) return walletFail("same", sameWalletMessage, 400);
    hot = session.wallet;
  }

  try {
    const { flow, challenge: c } = await challenge(new URL(request.url).origin, purpose, hot, body.memoPayer as string | undefined);
    await setWalletFlow(flow);
    return Response.json(c);
  } catch (e) {
    console.error("[auth] wallet challenge failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t prepare the login. Please try again." }, { status: 502 });
  }
}
