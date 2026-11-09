// Talks to Matrica (server-only). Wraps @matrica/oauth-sdk: build the login link, then turn the
// code Matrica sends back into "who is this and which Mad Lads do they hold".
import { MatricaOAuthClient } from "@matrica/oauth-sdk";
import { matricaConfig } from "./config";
import { MAX_LADS, type HolderSession } from "./session";
import { holderSince } from "@/lib/helius";
import { getSettings, saveSince } from "@/lib/db";

const WEEK_MS = 7 * 86_400_000;

const client = () => {
  const c = matricaConfig();
  return new MatricaOAuthClient({ clientId: c.clientId, clientSecret: c.clientSecret, redirectUri: c.redirectUri });
};

// Login link + the PKCE verifier to keep until Matrica sends the user back.
// The SDK doesn't add a `state`, so we add our own to reject logins we didn't start.
export async function loginUrl(state: string) {
  const { url, codeVerifier } = await client().getAuthorizationUrl(matricaConfig().scope);
  return { url: `${url}&state=${encodeURIComponent(state)}`, verifier: codeVerifier };
}

// "Mad Lads #1234" → 1234 (the on-chain name format, checked via Helius; Matrica should return the same).
const ladNumber = (name: string) => {
  const m = name.match(/#\s?(\d{1,5})\b/);
  return m ? Number(m[1]) : null;
};

type MatricaSession = Awaited<ReturnType<MatricaOAuthClient["createSession"]>>;

// The X handle linked to Matrica (shown on the passport), without the "@". Missing or refused → none.
async function xHandle(session: MatricaSession): Promise<string | undefined> {
  const x = await session.getUserTwitter().catch(() => null);
  return x?.externalName?.replace(/^@/, "") || undefined;
}

// The holder's roles on the Mad Lads Discord server, for the passport's role stamps.
// MADLADS_DISCORD_SERVER_ID keeps that server only; MADLADS_STAMP_ROLES (optional) limits them to
// the roles that deserve a stamp. Without the server id, no roles: other servers' roles don't belong here.
async function madLadsRoles(session: MatricaSession): Promise<string[] | undefined> {
  const { discordServerId, stampRoles } = matricaConfig();
  if (!discordServerId) return undefined;
  const all = (await session.getUserRoles().catch(() => null)) ?? [];
  const names = all
    .filter((r) => r.guildId === discordServerId && r.name !== "@everyone")
    .map((r) => r.name)
    .filter((name) => !stampRoles.length || stampRoles.some((s) => s.toLowerCase() === name.toLowerCase()));
  // keep the order of the list when there is one: the first roles get the stamps
  if (stampRoles.length) names.sort((a, b) => stampRoles.findIndex((s) => s.toLowerCase() === a.toLowerCase()) - stampRoles.findIndex((s) => s.toLowerCase() === b.toLowerCase()));
  return names.length ? names.slice(0, 2) : undefined;
}

export async function holderFromCode(code: string, verifier: string): Promise<Omit<HolderSession, "exp">> {
  const session = await client().createSession(code, verifier);
  const profile = await session.getUserProfile();

  // Every Mad Lad in the wallets linked to the Matrica account, 100 per page.
  const lads: number[] = [];
  const take = 100;
  for (let skip = 0; lads.length < MAX_LADS; skip += take) {
    const page = await session.getUserNFTs({ collectionId: matricaConfig().collectionId, skip, take });
    for (const nft of page.data) {
      const n = ladNumber(nft.name);
      if (n !== null) lads.push(n);
    }
    if (page.data.length < take || skip + take >= page.pagination.count) break;
  }

  const id = profile?.id ?? `matrica:${profile?.username ?? "unknown"}`;
  const [handle, roles] = await Promise.all([xHandle(session), madLadsRoles(session)]);
  const held = [...new Set(lads)].sort((a, b) => a - b);
  const settings = await getSettings(id).catch(() => null);

  // "Holder since" from the blockchain (Helius), over the Solana wallets linked to Matrica.
  // Saved in the database and only worked out again after a week (holdings change rarely).
  // TODO (first real login): confirm UserWallet.id is the wallet address.
  let since = settings?.since ?? undefined;
  const fresh = settings?.sinceCheckedAt && Date.now() - new Date(settings.sinceCheckedAt).getTime() < WEEK_MS;
  if (held.length && process.env.HELIUS_API_KEY && !fresh) {
    const wallets = await session.getUserWallets().catch(() => []);
    try {
      const found = await holderSince(wallets.filter((w) => w.networkSymbol === "SOL").map((w) => w.id));
      since = found ?? undefined;
      await saveSince(id, found).catch(() => {});
    } catch (e) {
      console.warn("[matrica] could not work out MAD since:", (e as Error).message); // keep the saved date, try again next login
    }
  }

  return {
    id,
    handle,
    roles,
    name: profile?.profile?.name || profile?.username || "MAD LAD",
    lads: held,
    since,
    photo: settings?.photo && held.includes(settings.photo) ? settings.photo : undefined,
  };
}
