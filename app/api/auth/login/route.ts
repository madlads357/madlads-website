import { redirect } from "next/navigation";
import { authMode } from "@/lib/auth/config";
import { loginUrl } from "@/lib/auth/matrica";
import { randomState, setLoginFlow, setSession } from "@/lib/auth/session";

// GET /api/auth/login → sends the visitor to Matrica to log in.
export async function GET(request: Request) {
  const mode = authMode();

  if (mode === "mock") {
    // Development only: skip Matrica. ?as=none tests the "no Lad found" screen.
    const none = new URL(request.url).searchParams.get("as") === "none";
    await setSession({ name: "Test Lad", lads: none ? [] : [1070, 2784, 4144, 5655, 7245, 8420, 9866] });
    redirect("/holders");
  }
  if (mode === "off") redirect("/holders");

  const state = randomState();
  const { url, verifier } = await loginUrl(state);
  await setLoginFlow({ verifier, state });
  redirect(url);
}
