import { redirect } from "next/navigation";
import { getSession, setSession, takeAccountFlow } from "@/lib/auth/session";
import { discordAccount } from "@/lib/accounts/discord";
import { refreshAccounts } from "@/lib/accounts/apply";
import { saveAccount } from "@/lib/db";

// GET /api/accounts/discord/callback → Discord sends the holder back here. Saves the account and its
// stamp roles, updates the session, and returns to /holders with a message (?linked / ?link=…).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;
  const [flow, session] = await Promise.all([takeAccountFlow(), getSession()]);
  if (!session) redirect("/holders");

  const error = params.get("error");
  // "Refresh roles" skips the consent screen; if Discord needs it again, ask normally.
  if (error && ["consent_required", "interaction_required", "login_required"].includes(error)) redirect("/api/accounts/discord/start");
  if (error) redirect("/holders?link=cancelled");
  const code = params.get("code");
  if (!code || !flow || flow.provider !== "discord" || flow.state !== params.get("state") || flow.holderId !== session.id) redirect("/holders?link=expired");

  let ok = false;
  try {
    await saveAccount(session.id, await discordAccount(url.origin, code));
    const { exp: _exp, ...rest } = session;
    await setSession(await refreshAccounts(rest));
    ok = true;
  } catch (e) {
    console.error("[accounts] Discord link failed:", (e as Error).message);
  }
  redirect(ok ? "/holders?linked=discord" : "/holders?link=error"); // redirect() must stay outside try/catch
}
