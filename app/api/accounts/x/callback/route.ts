import { redirect } from "next/navigation";
import { getSession, takeAccountFlow } from "@/lib/auth/session";
import { finishLink, XNeedsCredits } from "@/lib/accounts/x";
import { refreshAccounts } from "@/lib/accounts/apply";
import { saveAccount } from "@/lib/db";

// GET /api/accounts/x/callback → X sends the holder back here (?oauth_token&oauth_verifier, or
// ?denied when they cancel). Saves the X handle, updates the session, back to /holders with a message.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const [flow, session] = await Promise.all([takeAccountFlow(), getSession()]);
  if (!session) redirect("/holders");
  if (params.has("denied")) redirect("/holders?link=cancelled");

  const token = params.get("oauth_token");
  const verifier = params.get("oauth_verifier");
  if (!token || !verifier || !flow || flow.provider !== "x" || flow.state !== token || !flow.secret || flow.holderId !== session.id) redirect("/holders?link=expired");

  let result = "x-error";
  try {
    await saveAccount(session.id, await finishLink(token, flow.secret, verifier));
    await refreshAccounts(session); // keeps the session's expiry
    result = "ok";
  } catch (e) {
    if (e instanceof XNeedsCredits) result = "x-credits";
    console.error("[accounts] X link failed:", (e as Error).message);
  }
  redirect(result === "ok" ? "/holders?linked=x" : `/holders?link=${result}`); // redirect() must stay outside try/catch
}
