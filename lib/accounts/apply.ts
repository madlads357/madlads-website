// Puts the holder's linked accounts (Discord, X) into their session (server-only):
// the X handle and Discord stamp roles for the passport, and the name shown everywhere:
// the X handle first, then the Discord name, then the short wallet address.
import { setSession, type HolderSession } from "@/lib/auth/session";
import { shortAddress } from "@/lib/auth/hint";
import { accountsOf, type LinkedAccount } from "@/lib/db";
import { updateShareIdentity } from "@/lib/passport-share";

type Holder = Omit<HolderSession, "exp">;

// The name to fall back on when no account gives one: the short wallet address (or, for the
// development test logins, their fixed name).
function fallbackName(holder: { id: string; wallet?: string }) {
  if (holder.wallet) return shortAddress(holder.wallet);
  return holder.id.startsWith("mock:") ? "Jeff" : "MAD LAD";
}

export function applyAccounts(holder: Holder, accounts: LinkedAccount[]): Holder {
  const x = accounts.find((a) => a.provider === "x");
  const discord = accounts.find((a) => a.provider === "discord");
  return {
    ...holder,
    handle: x?.name,
    discord: discord?.name,
    roles: discord?.roles.length ? discord.roles : undefined,
    name: x ? `@${x.name}` : (discord?.name ?? fallbackName(holder)),
  };
}

// After linking, refreshing or unlinking an account: the session again, with the accounts as they are
// now. Its expiry is kept: only a wallet signature starts a new 8 hours. The holder's public passport
// link shows the same name, handle and stamps (an unlinked X handle must not stay online).
export async function refreshAccounts(session: HolderSession): Promise<void> {
  const { exp, ...rest } = session;
  const holder = applyAccounts(rest, await accountsOf(session.id).catch(() => []));
  await updateShareIdentity(holder.id, { name: holder.name, handle: holder.handle, roles: holder.roles }).catch((e) =>
    console.warn("[accounts] could not update the shared passport:", (e as Error).message),
  );
  await setSession(holder, exp);
}
