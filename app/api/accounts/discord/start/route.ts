import { redirect } from "next/navigation";
import { getSession, randomState, setAccountFlow } from "@/lib/auth/session";
import { authorizeUrl, discordEnabled } from "@/lib/accounts/discord";

// GET /api/accounts/discord/start → sends the logged-in holder to Discord to link their account,
// then back to /api/accounts/discord/callback. ?refresh: already linked once, skip the consent screen.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) redirect("/holders");
  if (!discordEnabled()) redirect("/holders?link=off");

  const url = new URL(request.url);
  const state = randomState();
  await setAccountFlow({ provider: "discord", state, holderId: session.id, exp: Date.now() + 600_000 });
  redirect(authorizeUrl(url.origin, state, url.searchParams.has("refresh")));
}
