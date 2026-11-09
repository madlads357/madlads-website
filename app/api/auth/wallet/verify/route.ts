import { authMode } from "@/lib/auth/config";
import { getSession, setSession, takeWalletFlow } from "@/lib/auth/session";
import { holderFromWallet, MAX_VAULTS, signerOf } from "@/lib/auth/wallet";
import { linkVault } from "@/lib/db";

// POST /api/auth/wallet/verify { signedMessage, signature } or { signedTransaction } (base64) → checks
// what Backpack signed for the last challenge and logs in (or links the vault). See lib/auth/wallet.ts.
export async function POST(request: Request) {
  if (authMode() !== "wallet") return Response.json({ error: "Wallet login is off" }, { status: 404 });
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Wrong origin" }, { status: 403 });

  const flow = await takeWalletFlow();
  if (!flow) return Response.json({ error: "expired", message: "That took too long. Please try again." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const signer = await signerOf(flow, body);
  if (!signer) return Response.json({ error: "signature", message: "The signature didn’t check out. Please try again." }, { status: 401 });

  if (flow.purpose === "link") {
    const session = await getSession();
    if (!session?.wallet || session.wallet !== flow.hot) return Response.json({ error: "expired", message: "You’re no longer logged in with that wallet." }, { status: 401 });
    if (signer === session.wallet) return Response.json({ error: "same", message: "That’s the wallet you’re logged in with. Switch to your vault wallet in Backpack, then sign again." }, { status: 400 });
    if (session.vaults?.includes(signer)) return Response.json({ error: "linked", message: "That wallet is already linked." }, { status: 400 });
    if ((session.vaults?.length ?? 0) >= MAX_VAULTS) return Response.json({ error: "full", message: `You can link up to ${MAX_VAULTS} wallets.` }, { status: 400 });
  }

  try {
    if (flow.purpose === "login") {
      const holder = await holderFromWallet(signer);
      await setSession(holder);
      return Response.json({ ok: true, lads: holder.lads.length });
    }
    await linkVault(signer, flow.hot!);
    const holder = await holderFromWallet(flow.hot!, true);
    await setSession(holder);
    return Response.json({ ok: true, lads: holder.lads.length });
  } catch (e) {
    console.error("[auth] wallet login failed:", (e as Error).message);
    return Response.json({ error: "lookup", message: "We couldn’t read your LADS from the blockchain. Please try again in a moment." }, { status: 502 });
  }
}
