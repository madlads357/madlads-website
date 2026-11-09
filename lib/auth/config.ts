// Holder login: configuration, read from environment variables (see .env.example).
// Server-only: never import this from a client component (it reads the Matrica client secret).
//
// Modes:
//   "wallet"   Login with Backpack (default): SESSION_SECRET and HELIUS_API_KEY are set
//   "matrica"  Login with Matrica, kept for later: AUTH_PROVIDER=matrica plus the MATRICA_* settings
//   "mock"     fake login for building the holder area: AUTH_MOCK=1, development only, nothing else set
//   "off"      nothing configured: the holder area shows "coming soon"
// In development, AUTH_MOCK=1 also adds test logins next to the real one (mockLogin()).
import { siteUrl } from "@/lib/site-url";

export type AuthMode = "wallet" | "matrica" | "mock" | "off";

const env = process.env;

export function authMode(): AuthMode {
  if (env.AUTH_PROVIDER === "matrica" && env.MATRICA_CLIENT_ID && env.MATRICA_COLLECTION_ID && env.SESSION_SECRET) return "matrica";
  if (env.SESSION_SECRET && env.HELIUS_API_KEY) return "wallet";
  if (mockLogin()) return "mock";
  return "off";
}

// Test logins (/api/auth/login?as=…), never in production. MATRICA_MOCK is the old name.
export const mockLogin = () => (env.AUTH_MOCK === "1" || env.MATRICA_MOCK === "1") && env.NODE_ENV !== "production";

export const matricaConfig = () => ({
  clientId: env.MATRICA_CLIENT_ID ?? "",
  clientSecret: env.MATRICA_CLIENT_SECRET || undefined,
  collectionId: env.MATRICA_COLLECTION_ID ?? "",
  redirectUri: `${siteUrl}/api/auth/callback`, // must be registered in the Matrica developer settings
  // socials.*: the X handle (passport) and the Discord account its roles come from
  scope: "profile wallets nfts socials.twitter socials.discord",
  // Roles: only from the Mad Lads Discord server, and (if listed) only these names earn a passport stamp
  discordServerId: env.MADLADS_DISCORD_SERVER_ID ?? "",
  // names only: entries are "role id:Name" (lib/accounts/discord.ts) or, older format, just "Name"
  stampRoles: (env.MADLADS_STAMP_ROLES ?? "")
    .split(",")
    .map((r) => r.trim().replace(/^\d{5,25}\s*:\s*/, ""))
    .filter(Boolean),
});

// Key used to encrypt the session cookies. For test logins without one, a fixed development key is fine.
export function sessionSecret(): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (mockLogin()) return "dev-only-mock-secret-not-for-production";
  throw new Error("SESSION_SECRET is not set");
}
