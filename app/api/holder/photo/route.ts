import { getSession, setSession } from "@/lib/auth/session";
import { savePhoto } from "@/lib/db";

// POST /api/holder/photo { photo } → saves the Lad chosen as passport photo (database + session),
// so it follows the holder on every device and the header shows it everywhere.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  const { photo } = (await request.json().catch(() => ({}))) as { photo?: number };
  const id = Number(photo);
  if (!session.lads.includes(id)) return Response.json({ error: "Not one of your LADS" }, { status: 400 });
  await savePhoto(session.id, id);
  const { exp: _exp, ...rest } = session;
  await setSession({ ...rest, photo: id }); // also refreshes the header cookie
  return Response.json({ ok: true });
}
