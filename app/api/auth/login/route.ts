import { redirect } from "next/navigation";
import { authMode } from "@/lib/auth/config";
import { loginUrl } from "@/lib/auth/matrica";
import { randomState, setLoginFlow, setSession } from "@/lib/auth/session";
import { getSettings } from "@/lib/db";

// GET /api/auth/login → sends the visitor to Matrica to log in.
export async function GET(request: Request) {
  const mode = authMode();

  if (mode === "mock") {
    // Development only: skip Matrica. ?as=none tests the "no Lad found" screen, ?as=whale a holder with 40 Lads.
    const as = new URL(request.url).searchParams.get("as");
    const test = [1070, 2784, 4144, 5655, 7245, 8420, 9866];
    const whale = [...test, ...Array.from({ length: 33 }, (_, i) => 101 + i * 293)];
    const lads = as === "none" ? [] : as === "whale" ? whale : test;
    const id = `mock:${as ?? "holder"}`;
    const saved = (await getSettings(id).catch(() => null))?.photo;
    await setSession({
      id,
      name: "Test Lad",
      handle: "testlad",
      since: "2023-04-21",
      roles: ["OG", "Mad Coach"],
      lads,
      photo: saved && lads.includes(saved) ? saved : undefined,
    });
    redirect("/holders");
  }
  if (mode === "off") redirect("/holders");

  const state = randomState();
  const { url, verifier } = await loginUrl(state);
  await setLoginFlow({ verifier, state });
  redirect(url);
}
