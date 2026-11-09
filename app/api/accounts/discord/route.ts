import { getSession } from "@/lib/auth/session";
import { refreshAccounts } from "@/lib/accounts/apply";
import { removeAccount } from "@/lib/db";

// DELETE /api/accounts/discord → unlinks the holder's Discord account (and its passport stamps).
export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  await removeAccount(session.id, "discord");
  await refreshAccounts(session); // keeps the session's expiry
  return Response.json({ ok: true });
}
