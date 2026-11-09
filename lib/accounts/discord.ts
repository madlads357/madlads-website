// Link Discord (server-only): Discord OAuth2, scopes "identify" (who they are) and
// "guilds.members.read" (their roles on the MAD LADS server, for the passport stamps).
// The access token is used once and revoked right away: we keep the account, never the token.
// "Refresh roles" simply links again (prompt=none: no consent screen the second time).
//
// Settings (.env.example): DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, MADLADS_DISCORD_SERVER_ID,
// MADLADS_STAMP_ROLES. Register the redirect <site>/api/accounts/discord/callback in the Discord app.
import type { LinkedAccount } from "@/lib/db";
import { accountsAvailable } from "./available";

const API = "https://discord.com/api/v10";
const SCOPE = "identify guilds.members.read";
const TIMEOUT_MS = 8000;
const MAX_STAMPS = 2; // the passport has room for two role stamps

const env = process.env;
export const discordEnabled = () => !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) && accountsAvailable();
const redirectUri = (origin: string) => `${origin}/api/accounts/discord/callback`;

// MADLADS_STAMP_ROLES: the roles that earn a stamp, most important first, as "role id:Stamp name".
// Discord only returns role ids, so the names come from here. e.g. "1234567890:OG,2345678901:Mad Coach"
// (Discord: Server Settings → Roles → right-click a role → Copy Role ID, with Developer Mode on).
export function stampRoles(): { id: string; name: string }[] {
  return (env.MADLADS_STAMP_ROLES ?? "")
    .split(",")
    .map((r) => r.trim().match(/^(\d{5,25})\s*:\s*(.+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ id: m[1], name: m[2].trim() }));
}

export function authorizeUrl(origin: string, state: string, refresh: boolean) {
  const q = new URLSearchParams({ response_type: "code", client_id: env.DISCORD_CLIENT_ID!, scope: SCOPE, state, redirect_uri: redirectUri(origin) });
  if (refresh) q.set("prompt", "none"); // already agreed once: straight back, no consent screen
  return `https://discord.com/oauth2/authorize?${q}`;
}

async function call<T>(path: string, init: RequestInit): Promise<{ status: number; body: T | null }> {
  const res = await fetch(`${API}${path}`, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  return { status: res.status, body: (await res.json().catch(() => null)) as T | null };
}

const form = (data: Record<string, string>) => ({
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID!, client_secret: env.DISCORD_CLIENT_SECRET!, ...data }),
});

// Code → the Discord account and its stamp roles on the MAD LADS server.
export async function discordAccount(origin: string, code: string): Promise<LinkedAccount> {
  const token = await call<{ access_token?: string }>("/oauth2/token", form({ grant_type: "authorization_code", code, redirect_uri: redirectUri(origin) }));
  const accessToken = token.body?.access_token;
  if (!accessToken) throw new Error(`Discord token ${token.status}`);
  const auth = { headers: { Authorization: `Bearer ${accessToken}` } };

  try {
    // Who they are, and (in parallel) their roles on the MAD LADS server.
    const server = env.MADLADS_DISCORD_SERVER_ID;
    const [user, member] = await Promise.all([
      call<{ id: string; username: string; global_name?: string | null }>("/users/@me", auth),
      server ? call<{ roles?: string[] }>(`/users/@me/guilds/${server}/member`, auth) : null,
    ]);
    if (!user.body?.id) throw new Error(`Discord user ${user.status}`);

    // Not a member (404): linked, just no stamps.
    let roles: string[] = [];
    if (member) {
      if (member.status !== 200 && member.status !== 404) throw new Error(`Discord member ${member.status}`);
      const held = new Set(member.body?.roles ?? []);
      roles = stampRoles()
        .filter((r) => held.has(r.id))
        .map((r) => r.name)
        .slice(0, MAX_STAMPS);
    }

    return { provider: "discord", accountId: user.body.id, name: user.body.global_name || user.body.username, roles };
  } finally {
    // We don't keep the token: revoke it so it can't be used again. Awaited (errors ignored): on serverless
    // hosting the function can stop as soon as the response is sent, and a revoke still in flight would be lost.
    await call("/oauth2/token/revoke", form({ token: accessToken, token_type_hint: "access_token" })).catch(() => {});
  }
}
