import { redirect } from "next/navigation";
import { authMode } from "@/lib/auth/config";
import { holderFromCode } from "@/lib/auth/matrica";
import { setSession, takeLoginFlow } from "@/lib/auth/session";

// GET /api/auth/callback → Matrica sends the visitor back here after they log in.
export async function GET(request: Request) {
  if (authMode() !== "matrica") redirect("/holders");

  const params = new URL(request.url).searchParams;
  const flow = await takeLoginFlow();

  if (params.get("error")) redirect("/holders?error=cancelled"); // they declined on Matrica
  const code = params.get("code");
  if (!code || !flow || params.get("state") !== flow.state) redirect("/holders?error=expired");

  let ok = false;
  try {
    await setSession(await holderFromCode(code, flow.verifier));
    ok = true;
  } catch (e) {
    console.error("[auth] Matrica login failed:", (e as Error).message);
  }
  redirect(ok ? "/holders" : "/holders?error=matrica"); // redirect() must stay outside try/catch
}
