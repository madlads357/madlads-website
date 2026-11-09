import { redirect } from "next/navigation";
import { getSession, setAccountFlow } from "@/lib/auth/session";
import { startLink, xEnabled } from "@/lib/accounts/x";

// GET /api/accounts/x/start → asks X for a request token and sends the logged-in holder to X to
// approve, then back to /api/accounts/x/callback. See lib/accounts/x.ts.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) redirect("/holders");
  if (!xEnabled()) redirect("/holders?link=off");

  let url: string | null = null;
  try {
    const link = await startLink(new URL(request.url).origin);
    await setAccountFlow({ provider: "x", state: link.token, secret: link.secret, holderId: session.id, exp: Date.now() + 600_000 });
    url = link.url;
  } catch (e) {
    console.error("[accounts] X link start failed:", (e as Error).message);
  }
  redirect(url ?? "/holders?link=x-error"); // redirect() must stay outside try/catch
}
