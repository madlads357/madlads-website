import { getSession, setSession } from "@/lib/auth/session";
import { refreshAccounts } from "@/lib/accounts/apply";
import { removeAccount } from "@/lib/db";

// DELETE /api/accounts/x → unlinks the holder's X account (the handle leaves their passport).
export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  await removeAccount(session.id, "x");
  const { exp: _exp, ...rest } = session;
  await setSession(await refreshAccounts(rest), session.exp); // same expiry: only a wallet signature starts a new session
  return Response.json({ ok: true });
}
