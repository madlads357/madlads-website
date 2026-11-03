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

# Later
- [ ] Matrica login and the holder area (the Culture Hub moves in there).
      Update the Privacy page (“Holder area”) and the Terms before the login goes live.
