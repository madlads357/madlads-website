// A small per-visitor limit for the login routes (server-only). It only counts inside one server
// instance, so on serverless hosting it is a speed bump, not a wall: it stops a simple loop from
// burning our Helius quota. A Vercel Firewall rate-limit rule on /api/auth/* is the real protection
// (see TODO.md).
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

// True if this request is allowed. `max` requests per minute per visitor and bucket.
export function rateLimit(request: Request, bucket: string, max: number): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k); // keep the map small
  return recent.length <= max;
}
