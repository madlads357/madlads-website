# Before launch

## Domain
- [ ] Point the domain (madlads.com) to the Vercel project.
- [ ] In Vercel, set `NEXT_PUBLIC_SITE_URL=https://madlads.com` and redeploy.
      This one setting updates the canonical URLs, `sitemap.xml`, `robots.txt`, the structured data and the link previews.

## Email addresses
Both are placeholders in `data/site.ts`:
- [ ] `legalEmail`: `legal@madlads.com`, used on the Terms and Privacy pages.
- [ ] `pressEmail`: `press@madlads.com`, used in the footer and the FAQ.

## Legal review (Backpack legal)
- [ ] Review `/terms` (`app/terms/page.tsx`) and `/privacy` (`app/privacy/page.tsx`).
- [ ] Decide whether to name the legal entity and governing law (the draft names neither).
- [ ] Link the Mad Lads art license from the Terms (section “Owning a Mad Lad”), if there is one.

## Copy review (community manager)
- [ ] FAQ answers (`app/page.tsx`).
- [ ] Lore chapters (`data/lore.ts`).

## Links to check
- [ ] Discord invite: https://discord.gg/madlads
- [ ] Press kit (Google Drive folder in `data/site.ts`)
- [ ] X account: https://x.com/MadLads

# After launch
- [ ] Add the domain to Google Search Console and submit `https://madlads.com/sitemap.xml`.
- [ ] Optional: turn on Vercel Speed Insights to see real visitors’ load times.
      It sets no cookies, but mention it on the Privacy page (“Data from your visit”) if you enable it.

# Matrica login (built, switched off, waiting for access)
Every setting is described in `.env.example`.
- [ ] Request API access on business.matrica.io. Ask for the client ID and secret, the Mad Lads collection ID (Matrica's own ID), token lifetimes and rate limits.
- [ ] Register the callback URLs with Matrica: `https://madlads.com/api/auth/callback` and `http://localhost:3000/api/auth/callback`.
- [ ] In Vercel, set `MATRICA_CLIENT_ID`, `MATRICA_CLIENT_SECRET`, `MATRICA_COLLECTION_ID` and `SESSION_SECRET`.
- [ ] Test a real login with a wallet that holds a Lad. Check that the Lad numbers come out right (`ladNumber` in `lib/auth/matrica.ts`).
- [ ] Update the Privacy page (“Holder area”, “Cookies and local storage”) and the Terms (“Holder area”): login cookie, data received from Matrica.
- [ ] Go live: set `NEXT_PUBLIC_HOLDERS_LIVE=1` and redeploy. The login buttons then open `/holders`.
- [ ] Decide what goes in the holder area (Culture Hub, perks).
