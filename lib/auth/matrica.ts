// Talks to Matrica (server-only). Wraps @matrica/oauth-sdk: build the login link, then turn the
// code Matrica sends back into "who is this and which Mad Lads do they hold".
import { MatricaOAuthClient } from "@matrica/oauth-sdk";
import { matricaConfig } from "./config";
import { MAX_LADS, type HolderSession } from "./session";

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

// "Mad Lads #1234" → 1234. TODO: confirm the name format Matrica returns for Mad Lads.
const ladNumber = (name: string) => {
  const m = name.match(/#\s?(\d{1,5})\b/);
  return m ? Number(m[1]) : null;
};

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

  return {
    name: profile?.profile?.name || profile?.username || "Mad Lad",
    avatar: profile?.profile?.pfp ?? undefined,
    lads: [...new Set(lads)].sort((a, b) => a - b),
  };
}
