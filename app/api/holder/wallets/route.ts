import { getSession, setSession } from "@/lib/auth/session";
import { holderFromWallet } from "@/lib/auth/wallet";
import { unlinkVault } from "@/lib/db";

// DELETE /api/holder/wallets removes a vault link (wallet login), from either side:
//   { vault }  logged in with the hot wallet: stop counting that vault's LADS (they leave the session)
//   { hot }    logged in with the vault wallet: stop that hot wallet from logging in for it
// Linking is in /api/auth/wallet/* (the vault has to sign).
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.wallet) return Response.json({ error: "Not logged in" }, { status: 401 });
  const { vault, hot } = (await request.json().catch(() => ({}))) as { vault?: string; hot?: string };

  if (typeof hot === "string" && hot) {
    try {
      await unlinkVault(session.wallet, hot); // this wallet is the vault
      return Response.json({ ok: true });
    } catch (e) {
      console.error("[holder] vault-side unlink failed:", (e as Error).message);
      return Response.json({ error: "Couldn’t remove that wallet. Please try again." }, { status: 502 });
    }
  }

  if (!vault || !session.vaults?.includes(vault)) return Response.json({ error: "Not a linked wallet" }, { status: 400 });
  try {
    await unlinkVault(vault, session.wallet);
    const holder = await holderFromWallet(session.wallet, true);
    await setSession(holder, session.exp); // the session's own expiry: unlinking isn't a new login
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[holder] unlink failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t update your LADS. Please try again." }, { status: 502 });
  }
}
