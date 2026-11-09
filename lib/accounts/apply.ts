// Puts the holder's linked accounts (Discord, X) into their session (server-only):
// the X handle and Discord stamp roles for the passport, and the name shown everywhere —
// the X handle first, then the Discord name, then the short wallet address.
import type { HolderSession } from "@/lib/auth/session";
import { accountsOf, type LinkedAccount } from "@/lib/db";

type Holder = Omit<HolderSession, "exp">;

export function applyAccounts(holder: Holder, accounts: LinkedAccount[], fallbackName: string): Holder {
  const x = accounts.find((a) => a.provider === "x");
  const discord = accounts.find((a) => a.provider === "discord");
  return {
    ...holder,
    handle: x?.name,
    discord: discord?.name,
    roles: discord?.roles.length ? discord.roles : undefined,
    name: x ? `@${x.name}` : (discord?.name ?? fallbackName),
  };
}

export async function withAccounts(holder: Holder, fallbackName: string): Promise<Holder> {
  const accounts = await accountsOf(holder.id).catch(() => []);
  return applyAccounts(holder, accounts, fallbackName);
}

// The name to fall back on when no account gives one: the short wallet address (or, for the
// development test logins, their fixed name).
export function fallbackName(session: { id: string; wallet?: string }) {
  if (session.wallet) return `${session.wallet.slice(0, 4)}…${session.wallet.slice(-4)}`;
  return session.id.startsWith("mock:") ? "Test LAD" : "MAD LAD";
}

// After linking or unlinking: the session again, with the accounts as they are now.
export async function refreshAccounts<T extends Holder>(session: T): Promise<Holder> {
  return withAccounts(session, fallbackName(session));
}
