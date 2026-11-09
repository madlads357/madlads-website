// Sign In With Solana (SIWS) text: the message a wallet shows and signs for `solana:signIn`.
// Shared by the browser (to build it when a wallet only has `solana:signMessage`) and the server
// (to read what the wallet actually signed). Format: the SIWS spec, as in @solana/wallet-standard-util.

export type SignInFields = {
  domain: string;
  address: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: string;
  nonce?: string;
  issuedAt?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
};

const LABELS = [
  ["uri", "URI"],
  ["version", "Version"],
  ["chainId", "Chain ID"],
  ["nonce", "Nonce"],
  ["issuedAt", "Issued At"],
  ["expirationTime", "Expiration Time"],
  ["notBefore", "Not Before"],
  ["requestId", "Request ID"],
] as const;

const HEADER = " wants you to sign in with your Solana account:";

export function signInText(f: SignInFields): string {
  let text = `${f.domain}${HEADER}\n${f.address}`;
  if (f.statement) text += `\n\n${f.statement}`;
  const fields: string[] = LABELS.filter(([key]) => f[key]).map(([key, label]) => `${label}: ${f[key]}`);
  if (f.resources?.length) fields.push("Resources:", ...f.resources.map((r) => `- ${r}`));
  if (fields.length) text += `\n\n${fields.join("\n")}`;
  return text;
}

// The fields of a SIWS message, or null if it isn't one. Unknown lines make it invalid: what the
// wallet showed must be exactly what we check.
export function parseSignInText(text: string): SignInFields | null {
  const lines = text.split("\n");
  if (!lines[0]?.endsWith(HEADER) || !lines[1]) return null;
  const out: SignInFields = { domain: lines[0].slice(0, -HEADER.length), address: lines[1] };
  let i = 2;
  // optional statement: a blank line, the statement, then (if fields follow) another blank line
  if (lines[i] === "" && lines[i + 1] !== undefined && !LABELS.some(([, l]) => lines[i + 1].startsWith(`${l}: `))) {
    out.statement = lines[i + 1];
    i += 2;
  }
  if (i >= lines.length) return out;
  if (lines[i] !== "") return null;
  for (i++; i < lines.length; i++) {
    const line = lines[i];
    if (line === "Resources:") {
      out.resources = lines.slice(i + 1).map((r) => r.replace(/^- /, ""));
      break;
    }
    const field = LABELS.find(([, label]) => line.startsWith(`${label}: `));
    if (!field) return null;
    out[field[0]] = line.slice(field[1].length + 2);
  }
  return out;
}
