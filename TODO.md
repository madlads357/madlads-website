# Launch plan

Do these in order. Test everything on the free `*.vercel.app` address before buying or pointing the domain.
Every setting is described in `.env.example`.

## 1. Test on the `*.vercel.app` address

### Environment variables (Vercel → Project → Settings → Environment Variables)
`NEXT_PUBLIC_*` values are baked in at build time: change one, then redeploy.

| Variable | What to do |
| --- | --- |
| `SESSION_SECRET` | **New.** A long random string, not the one in `.env.local`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Changing it later logs everyone out. |
| `HELIUS_API_KEY` | Already set. Check it. |
| `DATABASE_URL` | Set by Vercel's Neon integration. Check it is the database you expect (see the next step). |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | **New.** From the Discord developer portal → your app → OAuth2. |
| `MADLADS_DISCORD_SERVER_ID` | Check it is set (the ID is in `.env.local`). |
| `MADLADS_STAMP_ROLES` | **New.** The roles that earn a passport stamp, most important first, as `role id:Stamp name` (e.g. `1234567890123456:OG,2345678901234567:Mad Coach`). Without it, Discord links but gives no stamps. |
| `X_API_KEY`, `X_API_SECRET` | **New.** The app's "API Key and Secret" (consumer keys) from the X Developer Console. |
| `MAPBOX_TOKEN` | **New.** A **public** Mapbox token (`pk.…`) for the holder map. No `NEXT_PUBLIC_` in the name: the server only gives it to logged-in holders. Restrict it by URL (see "Provider portals"). |
| `MAPBOX_STYLE` | Optional. A custom Mapbox Studio style URL (`mapbox://styles/<user>/<id>`). Empty: the default light style, tinted cream in code. |
| `AUTH_PROVIDER` | Leave empty (Login with Backpack). |
| `MATRICA_*`, `MATRICA_MOCK`, `AUTH_MOCK` | Remove if present. `AUTH_MOCK` must never be set in Vercel. |
| `NEXT_PUBLIC_HOLDERS_LIVE`, `NEXT_PUBLIC_SITE_URL` | Not yet: steps 2 and 3. |

### Database
- [ ] If Vercel's Neon database is not the one in `.env.local` (different database or branch), run `npm run db:setup` against it once, with its `DATABASE_URL`.
      It creates the six tables: `holder_settings`, `share_links`, `wallet_links`, `holder_accounts`, `used_nonces`, `holder_locations`.

### Provider portals
- [ ] **Discord** (developer portal → OAuth2 → Redirects): add `https://<project>.vercel.app/api/accounts/discord/callback`. Keep the localhost one. Copy it exactly: a trailing space breaks it.
- [ ] **X** (Developer Console → the app → User authentication settings): add `https://<project>.vercel.app/api/accounts/x/callback`, keep localhost.
      The app should be a Web App with Read permission, a **$0 spend cap**, and website, terms and privacy URLs set. Ideally the app belongs to the MAD LADS X account, since holders see its name on the Authorize screen.

- [ ] **Mapbox** (account.mapbox.com → Access tokens → the holder map token → URL restrictions): allow only `http://localhost:3000/*` and `https://<project>.vercel.app/*`. A public token is readable by any logged-in holder, so the URL list is what protects it. Use a token of its own, not the Culture Hub's. Tick no secret scopes. Check the usage page after the first week (50,000 map loads a month are free).

### Protect the login routes
- [ ] Vercel Firewall → add a rule: path **starts with** `/api/auth/` → rate limit, fixed window 60 s, **30 requests**, key IP, respond 429.
      Publish it. Try it first with the action set to *Log*. The limit in the code (`lib/rate-limit.ts`) only counts inside one server instance, so it is a speed bump, not a wall.

### Real tests (on the deployed address)
- [x] Backpack login with a normal account (works locally).
- [ ] Backpack login with a **Ledger account** selected in Backpack ("I use a Ledger").
- [ ] Link a Ledger vault to a hot wallet, then remove the link from each side.
- [ ] **Phone:** "Open in Backpack" should open the site in the Backpack app's browser. The link format (`openInBackpackApp` in `lib/wallet/backpack.ts`) has not been checked yet.
- [ ] **Discord:** link, then ⋯ → Refresh roles (stamps need `MADLADS_STAMP_ROLES`), then unlink. Check that `guilds.members.read` works without Discord approval.
- [ ] **X:** link, switch account, unlink. The first local link worked with the $0 cap (the handle comes free in the OAuth reply).
- [ ] The shared passport link (`/p/<code>`) shows the new name and stamps, and loses them after an unlink.
- [ ] **Holder map** (`/holders/map`): put a pin (it starts anonymous; then show your name and Lad), move it, remove it, and look at the map as a second holder. Check it on a phone, and that a logged-out visitor is sent to `/holders`.
- [ ] The Privacy page and Terms describe the holder map (an opt-in pin at city level, anonymous by default, shown to other holders, removed on request). Have the legal review cover it.
- [ ] **Remove the test holders** from the database before launch: `npm run db:seed-map -- --remove --yes` (they are the rows with ids like `test:12`). Never run the seed script against the production database.
- [ ] Check the pin lifecycle on the deployed site: a wallet with no Lad but a pin sees “Your pin is still on the map” and can remove it, and a pin whose `updated_at` is older than 12 months does not show (then comes back when its holder opens the map).

## 2. Domain
- [ ] Buy the domain and add it to the Vercel project; point the DNS as Vercel shows.
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://madlads.com` and redeploy.
      This updates the canonical URLs, `sitemap.xml`, `robots.txt`, the structured data and the link previews.
- [ ] **Discord:** add `https://madlads.com/api/accounts/discord/callback` (and keep the others you still test with).
- [ ] **X:** add `https://madlads.com/api/accounts/x/callback`, and update the website, terms and privacy URLs.
- [ ] **Mapbox:** add `https://madlads.com/*` and `https://www.madlads.com/*` to the token's URL restrictions. Until you do, the holder map shows an empty grey box on the new domain. Remove the `vercel.app` and `localhost` entries once you no longer test there.
- [ ] Anyone logged in on the `vercel.app` address has to log in again on the domain (cookies belong to one address).

## 3. Go live
- [ ] Replace the placeholder emails in `data/site.ts`: `legalEmail` (`legal@madlads.com`, Terms and Privacy) and `pressEmail` (`press@madlads.com`, footer and FAQ).
- [ ] Check the links: Discord invite https://discord.gg/madlads, the press kit (Google Drive folder in `data/site.ts`), X account https://x.com/MadLads.
- [ ] Set `NEXT_PUBLIC_HOLDERS_LIVE=1` and redeploy. The login buttons then point to the holder area. Do this last.

## Reviews by other people
These don't block the technical steps, but they block the launch.
- [ ] **Legal (Backpack legal):** review `/terms` and `/privacy` (`app/terms/page.tsx`, `app/privacy/page.tsx`). They describe the wallet login, vault links, Discord and X linking, the cookies and what we store.
- [ ] Decide whether to name the legal entity and the governing law (the drafts name neither).
- [ ] Link the Mad Lads art license from the Terms (section “Owning a Mad Lad”), if there is one.
- [ ] **Copy (community manager):** the FAQ answers (`app/page.tsx`) and the Lore chapters (`data/lore.ts`).

## After launch
- [ ] Add the domain to Google Search Console and submit `https://madlads.com/sitemap.xml`.
- [ ] Watch the first logins: Vercel function logs for `[auth]`, `[wallet]`, `[accounts]` errors, and the Helius usage page.
- [ ] Optional: turn on Vercel Speed Insights. It sets no cookies, but then mention it on the Privacy page (“Data from your visit”).

## Later: the holder area
- [ ] Decide what else goes in it. Done: passport, wallpapers, dressing room, playlist, meme vault, holder map, the Heist game link. Still on the Culture Hub: events, directory (the map could show events later).
- [ ] Add the Culture Hub ticket to the backpack (`data/bag.ts`) once its image exists.

---

## Done
- [x] Login with Backpack: Sign In With Solana, "I use a Ledger" (a memo transaction, never sent), vault wallets linked to a hot wallet, built on Solana Kit.
- [x] Link Discord (roles become passport stamps) and link X (handle on the passport), from the profile.
- [x] Reviews of the login code: a bug review, a cleanup pass and a security review (nothing exploitable found), with the findings fixed.
- [x] Privacy page and Terms updated for all of the above (still waiting for the legal review).
- [x] Database (Neon) connected locally, tables created with `npm run db:setup` (`db/schema.sql`).
- [x] README with images (`npm run screenshots`).
- [x] Holder map (`/holders/map`): opt-in city-level pins, anonymous by default, 2D/3D, clusters and a bottom sheet on phones. Mapbox draws the map, the city search is a GeoNames list on our server. Reviewed (a code review, fixes applied). Privacy, Terms and README updated (still waiting for the legal review).

## Parked: Matrica login
Built and kept behind `AUTH_PROVIDER=matrica`. Paused: Matrica asks 4k a year, and the wallet login replaces it. To switch back:
- [ ] Get API access on business.matrica.io: client ID and secret, the Mad Lads collection ID (Matrica's own ID), token lifetimes and rate limits.
- [ ] Register the callbacks `https://madlads.com/api/auth/callback` and `http://localhost:3000/api/auth/callback`.
- [ ] In Vercel, set `AUTH_PROVIDER=matrica`, `MATRICA_CLIENT_ID`, `MATRICA_CLIENT_SECRET`, `MATRICA_COLLECTION_ID` and `SESSION_SECRET`. The login button on `/holders` then goes to Matrica and back, and linking X and Discord is switched off (Matrica brings them).
- [ ] At the first real login, check that `UserWallet.id` is the wallet address (`lib/auth/matrica.ts`, needed for "Days Mad"), that the Lad numbers come out right (`ladNumber`), and that Matrica returns the X handle and the Discord roles with the scopes asked (`socials.twitter socials.discord`, in `lib/auth/config.ts`).
- [ ] The Privacy page and Terms describe the wallet login: their Matrica wording is in the git history (before Nov 9, 2026).
