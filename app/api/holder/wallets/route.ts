import { getSession, setSession } from "@/lib/auth/session";
import { holderFromWallet } from "@/lib/auth/wallet";
import { unlinkVault } from "@/lib/db";

// DELETE /api/holder/wallets { vault } → removes a linked vault wallet (wallet login), and its LADS
// from the session. Linking is in /api/auth/wallet/* (the vault has to sign).
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.wallet) return Response.json({ error: "Not logged in" }, { status: 401 });
  const { vault } = (await request.json().catch(() => ({}))) as { vault?: string };
  if (!vault || !session.vaults?.includes(vault)) return Response.json({ error: "Not a linked wallet" }, { status: 400 });
  try {
    await unlinkVault(vault, session.wallet);
    const holder = await holderFromWallet(session.wallet, true);
    await setSession(holder);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[holder] unlink failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t update your LADS. Please try again." }, { status: 502 });
  }
}
