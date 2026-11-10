import { getSession } from "@/lib/auth/session";
import { removePin, savePin } from "@/lib/db";
import { isKnownCity } from "@/lib/cities";

// The holder's own pin on the holder map (/holders/map). Only the signed-in holder can change their own pin.
//   PUT    { city, country, lat, lng, showIdentity }  puts (or moves) the pin
//   DELETE                                             takes it off the map: the row is deleted
// The pin is the centre of a city from the GeoNames list (lib/cities.ts): never an address.

const round = (n: number) => Math.round(n * 100) / 100;

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  if (session.lads.length === 0) return Response.json({ error: "The map is for holders." }, { status: 403 }); // the page redirects these away, so the API must refuse them too
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const city = typeof b.city === "string" ? b.city.trim().slice(0, 80) : "";
  const country = typeof b.country === "string" ? b.country.trim().toUpperCase() : "";
  const lat = Number(b.lat);
  const lng = Number(b.lng);
  if (!city || !/^[A-Z]{2}$/.test(country) || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || typeof b.showIdentity !== "boolean")
    return Response.json({ error: "Pick a city from the list." }, { status: 400 });

  // Only a city centre from our list (lib/cities.ts), never free coordinates.
  if (!isKnownCity(city, country, round(lat), round(lng))) return Response.json({ error: "Pick a city from the list." }, { status: 400 });

  try {
    await savePin(session.id, { city, country, lat: round(lat), lng: round(lng), showIdentity: b.showIdentity }, session.photo ?? session.lads[0] ?? null);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[map] save failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t save your pin. Please try again." }, { status: 502 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Not logged in" }, { status: 401 });
  try {
    await removePin(session.id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[map] remove failed:", (e as Error).message);
    return Response.json({ error: "Couldn’t remove your pin. Please try again." }, { status: 502 });
  }
}
