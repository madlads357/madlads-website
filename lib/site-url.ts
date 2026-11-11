// Public address of the site, used for absolute links in metadata (link-preview images…).
// 1. NEXT_PUBLIC_SITE_URL — set it (e.g. https://madlads.com) once the domain points here
// 2. Vercel's production domain — provided automatically by Vercel at build time
// 3. Local development
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

// The same address as text, without "https://" and "www." (e.g. "madlads.com"): what is printed on the passport.
export const siteHost = new URL(siteUrl).host.replace(/^www\./, "");
