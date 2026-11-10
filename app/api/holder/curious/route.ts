import { getSession } from "@/lib/auth/session";
import { saveCurious } from "@/lib/db";
import { updateShareCurious } from "@/lib/passport-share";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/holder/curious: the holder found enough hidden spots in the MAD Horoscope caravan (counted in their browser).
// It is a game with a stamp, not a prize, so the browser's word is enough: it only sets a yes on the holder's own passport.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.lads.length === 0) return Response.json({ error: "Not logged in" }, { status: 401 });
  if (!rateLimit(request, "curious", 20)) return Response.json({ error: "Slow down a little." }, { status: 429 });
  try {
    await saveCurious(session.id);
    await updateShareCurious(session.id).catch(() => {}); // an existing shared link gets the stamp too
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[horoscope] could not save Curious:", (e as Error).message);
    return Response.json({ error: "Couldn’t save it right now." }, { status: 503 });
  }
}
