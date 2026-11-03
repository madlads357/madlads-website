import { clearSession } from "@/lib/auth/session";

// POST /api/auth/logout → clears the session (a form posts here, so links can't log people out).
// 303 turns the POST into a GET of /holders.
export async function POST(request: Request) {
  await clearSession();
  return Response.redirect(new URL("/holders", request.url), 303);
}
