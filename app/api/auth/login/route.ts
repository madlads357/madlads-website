import { redirect } from "next/navigation";
import { authMode, mockLogin } from "@/lib/auth/config";
import { loginUrl } from "@/lib/auth/matrica";
import { getSession, randomState, setLoginFlow, setSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/db";

// GET /api/auth/login → Matrica mode: sends the visitor to Matrica to log in, then back to /holders.
// Wallet mode: the login happens on /holders (Login with Backpack), so this just goes there.
// Development with AUTH_MOCK=1: ?as=holder|none|whale logs in as a test holder. Already logged in: /holders.
export async function GET(request: Request) {
  const mode = authMode();
  const params = new URL(request.url).searchParams;
  const again = params.has("again") || params.has("as"); // "Log in again" (another wallet linked since), or a mock test user
  if (mode !== "off" && !again && (await getSession())) redirect("/holders");

  if (mockLogin() && (mode === "mock" || params.has("as"))) {
    // Development only: skip Matrica. ?as=none tests the "no Lad found" screen, ?as=whale a holder with 40 Lads.
    const as = params.get("as");
    const test = [1070, 2784, 4144, 5655, 7245, 8420, 9866];
    const whale = [...test, ...Array.from({ length: 33 }, (_, i) => 101 + i * 293)];
    const lads = as === "none" ? [] : as === "whale" ? whale : test;
    const id = `mock:${as ?? "holder"}`;
    const saved = (await getSettings(id).catch(() => null))?.photo;
    await setSession({
      id,
      name: "Jeff",
      handle: "jeff",
      since: "2023-04-21",
      roles: ["OG", "Mad Coach"],
      lads,
      photo: saved && lads.includes(saved) ? saved : undefined,
    });
    redirect("/holders");
  }
  if (mode !== "matrica") redirect("/holders");

  const state = randomState();
  const { url, verifier } = await loginUrl(state);
  await setLoginFlow({ verifier, state });
  redirect(url);
}
