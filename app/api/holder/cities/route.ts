import { getSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { searchCities } from "@/lib/cities";

// GET /api/holder/cities?q=amst → up to 6 cities for the holder map's "Put me on the map" search.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  if (!rateLimit(request, "cities", 120)) return Response.json({ error: "Too many searches. Slow down a little." }, { status: 429 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ cities: searchCities(q) });
}
