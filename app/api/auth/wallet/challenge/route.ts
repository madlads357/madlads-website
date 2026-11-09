import { authMode } from "@/lib/auth/config";
import { getSession, setWalletFlow } from "@/lib/auth/session";
import { challenge, isAddress, MAX_VAULTS } from "@/lib/auth/wallet";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";



// POST /api/auth/wallet/challenge { purpose: "login" | "link", memoPayer? } → what Backpack signs:
// { signIn } (Sign In With Solana fields) or, with memoPayer (Ledger fallback), { transaction } (base64).
// See lib/auth/wallet.ts.
export async function POST(request: Request) {
  if (authMode() !== "wallet") return Response.json({ error: "Wallet login is off" }, { status: 404 });
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ error: "Wrong origin" }, { status: 403 });
  if (!rateLimit(request, "wallet-challenge", 30)) return Response.json({ error: "slow", message: "Too many attempts. Please wait a minute and try again." }, { status: 429 });

  const body = (await request.json().catch(() => ({}))) as { purpose?: unknown; memoPayer?: unknown };
  const purpose = body.purpose === "link" ? "link" : "login";
  if (body.memoPayer !== undefined && !isAddress(body.memoPayer)) return Response.json({ error: "Not a Solana address" }, { status: 400 });

  let hot: string | undefined;
  if (purpose === "link") {
    const session = await getSession();
    if (!session?.wallet) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (!db) return Response.json({ error: "Linking wallets needs the database" }, { status: 503 });
    if ((session.vaults?.length ?? 0) >= MAX_VAULTS) return Response.json({ error: "full", message: `You can link up to ${MAX_VAULTS} wallets.` }, { status: 400 });
    if (body.memoPayer === session.wallet) return Response.json({ error: "same", message: "That’s the wallet you’re logged in with. Switch to your vault wallet in Backpack first." }, { status: 400 });
    hot = session.wallet;
  }

  try {
    const { flow, challenge: c } = await challenge(origin, purpose, hot, body.memoPayer as string | undefined);
    await setWalletFlow(flow);
    return Response.json(c);
  } catch (e) {
    console.error("[auth] wallet challenge failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t prepare the login. Please try again." }, { status: 502 });
  }
}
