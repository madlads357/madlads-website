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

# Login with Backpack (the default holder login)
How it works: `lib/auth/wallet.ts` (server) and `lib/wallet/backpack.ts` (browser). Settings in `.env.example`.
- [x] Built on Solana Kit (`@solana/kit-plugin-wallet`, as the solana-dev skill recommends). Sign In With Solana (`solana:signIn`, as an offchain message where Backpack supports it); "I use a Ledger": a checklist, then a memo transaction approved on the device and never sent; vault links (cold wallet → hot wallet). Checked end to end over HTTP with test keys (28 checks).
- [x] Test with a real Backpack: a normal account.
- [ ] Test with a real Ledger account selected in Backpack (tick "I use a Ledger"), and linking a Ledger vault to a hot wallet.
- [ ] Test on a phone: "Open in Backpack" should open the site in the Backpack app's browser (`openInBackpackApp` in `lib/wallet/backpack.ts`; the link format still needs checking).
- [ ] In Vercel (Project → Settings → Environment Variables), set:
  - `SESSION_SECRET`: encrypts the login cookie. A long random string, made with
    `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`.
    Use a new one for production (not the one in `.env.local`). Changing it later logs everyone out.
  - `AUTH_PROVIDER`: leave it empty for Login with Backpack. Set it to `matrica` only to switch back to Matrica
    (that also needs the `MATRICA_*` settings below).
  - `HELIUS_API_KEY`: already set.
  - Then `NEXT_PUBLIC_HOLDERS_LIVE=1` and redeploy to go live.
- [ ] Run `npm run db:setup` against the production database once (new table `wallet_links`).
- [ ] Next: link X and Discord from the profile page (passport handle and role stamps; Matrica gave these before).
- [ ] Legal review of the updated Privacy and Terms (now about the wallet login).

# Matrica login (built, kept for later: AUTH_PROVIDER=matrica)
Paused: Matrica asks 4k a year. Wallet login is the default meanwhile.
Every setting is described in `.env.example`.
- [ ] Request API access on business.matrica.io. Ask for the client ID and secret, the Mad Lads collection ID (Matrica's own ID), token lifetimes and rate limits.
- [ ] Register the callback URLs with Matrica: `https://madlads.com/api/auth/callback` and `http://localhost:3000/api/auth/callback`.
- [ ] In Vercel, set `MATRICA_CLIENT_ID`, `MATRICA_CLIENT_SECRET`, `MATRICA_COLLECTION_ID` and `SESSION_SECRET`.
- [ ] Test a real login with a wallet that holds a Lad. Check that the Lad numbers come out right (`ladNumber` in `lib/auth/matrica.ts`).
- [x] Privacy page and Terms updated for the holder area (cookies, Matrica, Helius, database, share links). Still needs the legal review above.
- [ ] To switch to Matrica: `AUTH_PROVIDER=matrica` plus the settings above. The login button on /holders then goes to Matrica and back.
- [x] Helius key set (local + Vercel); collection address and API responses checked.
- [ ] At the first real Matrica login, check in `lib/auth/matrica.ts` that `UserWallet.id` is the wallet address (needed for "Days Mad").
- [x] Database (Neon) connected; tables created with `npm run db:setup` (db/schema.sql).
- [ ] If production uses a different Neon database or branch than .env.local, run `npm run db:setup` against it once (with its DATABASE_URL).
- [x] Mad Lads Discord server ID: 971847939456639047 (in .env.local; set `MADLADS_DISCORD_SERVER_ID` in Vercel).
- [ ] Optional: `MADLADS_STAMP_ROLES` in Vercel = the roles that earn a passport stamp, most important first (e.g. "OG,Mad Coach"). Without it, any of the holder's roles on the server can be stamped.
- [ ] At the first real login, check that Matrica returns the X handle and the Discord roles with the scopes asked (`socials.twitter socials.discord`, in `lib/auth/config.ts`).
- [ ] Decide what else goes in the holder area. Done: meme vault, Dressing Room, playlist (Spotify), wallpapers (phone, desktop, X banner). Still on the hub: mini-games, events, directory.
- [ ] Add the Culture Hub ticket to the backpack (`data/bag.ts`) once its image exists.
