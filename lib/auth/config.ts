// Login with Matrica: configuration, read from environment variables (see .env.example).
// Server-only: never import this from a client component (it reads the client secret).
//
// Three modes:
//   "matrica"  real login: MATRICA_CLIENT_ID, MATRICA_COLLECTION_ID and SESSION_SECRET are set
//   "mock"     fake Matrica for building the holder area: MATRICA_MOCK=1, development only
//   "off"      nothing configured: the holder area shows "coming soon" (today's behaviour)
import { siteUrl } from "@/lib/site-url";

export type AuthMode = "matrica" | "mock" | "off";

const env = process.env;

export function authMode(): AuthMode {
  if (env.MATRICA_CLIENT_ID && env.MATRICA_COLLECTION_ID && env.SESSION_SECRET) return "matrica";
  if (env.MATRICA_MOCK === "1" && env.NODE_ENV !== "production") return "mock";
  return "off";
}

export const matricaConfig = () => ({
  clientId: env.MATRICA_CLIENT_ID ?? "",
  clientSecret: env.MATRICA_CLIENT_SECRET || undefined,
  collectionId: env.MATRICA_COLLECTION_ID ?? "",
  redirectUri: `${siteUrl}/api/auth/callback`, // must be registered in the Matrica developer settings
  scope: "profile wallets nfts",
});

// Key used to encrypt the session cookies. In mock mode a fixed development key is fine.
export function sessionSecret(): string {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (authMode() === "mock") return "dev-only-mock-secret-not-for-production";
  throw new Error("SESSION_SECRET is not set");
}
