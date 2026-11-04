import { getSession } from "@/lib/auth/session";
import { makeShareToken, shareFromSession } from "@/lib/passport-share";

// POST /api/passport/share { photo } → { url }: the public link to the logged-in holder's passport.
// Built from the session only (the holder picks the photo among their own Lads, nothing else).
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.lads.length === 0) return Response.json({ error: "Not logged in" }, { status: 401 });
  const { photo } = (await request.json().catch(() => ({}))) as { photo?: number };
  const token = makeShareToken(shareFromSession(session, Number(photo)));
  return Response.json({ url: `${new URL(request.url).origin}/passport/${token}` });
}
