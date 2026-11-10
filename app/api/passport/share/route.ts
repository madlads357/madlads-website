import { getSession } from "@/lib/auth/session";
import { db, getCurious, getMyPin } from "@/lib/db";
import { deleteShareLink, makeShareToken, shareFromSession, storeShareLink } from "@/lib/passport-share";

// POST /api/passport/share { photo } → { url, views?, removable }: the public link to the holder's passport.
// Built from the session only (the holder picks the photo among their own Lads, nothing else).
// With the database: a short link (/p/<code>) with a view count that can be withdrawn; without: a signed token.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.lads.length === 0) return Response.json({ error: "Not logged in" }, { status: 401 });
  const { photo } = (await request.json().catch(() => ({}))) as { photo?: number };
  const onMap = !!(await getMyPin(session.id).catch(() => null)); // the stamp says "on the map", never where
  const passport = shareFromSession(session, Number(photo), onMap, await getCurious(session.id));
  const origin = new URL(request.url).origin;

  const stored = await storeShareLink(session.id, passport).catch((e) => {
    console.error("[share] could not store the link:", (e as Error).message);
    return null;
  });
  if (stored) return Response.json({ url: `${origin}/p/${stored.code}`, views: stored.views, removable: true });
  return Response.json({ url: `${origin}/passport/${makeShareToken(passport)}`, removable: false });
}

// DELETE /api/passport/share → the holder's short link stops working.
export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  if (!db) return Response.json({ error: "Links can't be withdrawn without the database" }, { status: 400 });
  await deleteShareLink(session.id);
  return Response.json({ ok: true });
}
