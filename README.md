# Mad Lads — website

The new website for [Mad Lads](https://madlads.com), the Solana collection by Backpack:
a homepage, the **Lore** page, and an explorer for **all 9,971 Mad Lads** with search and trait filters.

**Stack:** Next.js 16 (App Router, static pages) · React 19 · TypeScript · Tailwind CSS 4 · Lenis · Geist font
**Design:** [Figma file](https://www.figma.com/design/yJT0LFzcDQkT3OaeJuCl3S/MadLads) — tokens, components and the homepage

---

## Getting started

Requires **Node.js 20.9+**.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (all pages are static) |
| `npm start` | Serve the production build |
| `npm run typecheck` | TypeScript check (`next lint` no longer exists in Next 16) |
| `npm run data:madlads` | Rebuild the collection data from the official S3 metadata (see below) |

## Pages

| Route | File | Content |
| --- | --- | --- |
| `/` | `app/page.tsx` | Hero (video), Mad Lads preview, manifesto + stats, Lads marquee, lore teaser, art (1/1s & specials), holders, news, Backpack, press, FAQ |
| `/lore` | `app/lore/page.tsx` | “The story so far” — 5 chapters from the mint (2023) to today |
| `/madlads` | `app/madlads/page.tsx` | Explorer: 9,971 Lads, number search, 16 trait filters, sort, detail view |

## Project structure

```
app/                 Routes, root layout, global styles (design tokens), favicon
components/          UI components (Nav, Button, Section, ArtCard, Faq, Marquee, ScrollWords, SmoothScroll, MadLadsExplorer…)
data/                Editable content: lore, art, news, links, homepage preview Lads
lib/madlads.ts       Collection loading + image URL helpers
public/
  data/madlads.json  Metadata of the whole collection (generated)
  lads/              20 preview Lads used on the homepage
  art/               Pieces that only exist outside the collection (newsletter, merch, sketches)
  video/             Hero background video + poster
brand/media-kit/     Official logos (Mad Lads Media Kit) — source of components/Logo.tsx
scripts/             build-madlads-data.mjs
```

## Editing content

Most text lives in `data/`, not in the components:

| To change… | Edit |
| --- | --- |
| Lore chapters | `data/lore.ts` |
| 1/1s, honoraries, previews & specials | `data/art.ts` |
| News cards | `data/news.ts` |
| Nav links, socials, marketplaces, press kit, Matrica URL | `data/site.ts` |
| Homepage sections, FAQ, stats, manifesto | `app/page.tsx` |

## Design tokens

Defined once in `app/globals.css` (`@theme`), mirroring the Figma variables:

| Token | Value | Use |
| --- | --- | --- |
| `paper` | `#f6f1e8` | Page background |
| `surface` / `sunken` | `#ffffff` / `#ede6da` | Cards, alternate sections |
| `ink` / `muted` | `#111111` / `#5c574f` | Text |
| `red` | `#f62038` | **Brand red** — logo, large display words |
| `accent` | `#c41129` | Accessible red for buttons and small text (WCAG AA) |
| `line` | `#e2dacc` | Borders |

Text styles: `t-display-xl`, `t-display-l`, `t-h2`, `t-h3`, `t-body-l`, `t-eyebrow`.

## Mad Lads images & data

Nothing is downloaded in advance — images are requested **by number**, only when they appear on screen.

- **Metadata** — `public/data/madlads.json` (~90 KB gzipped) holds the traits of every Lad in a compact,
  index-based format. Regenerate it with `npm run data:madlads` (reads `json/{id}.json` on the official bucket).
- **Originals** — `https://madlads.s3.us-west-2.amazonaws.com/images/{id}.png` (2048×2560, ~5 MB).
  Honoraries #1–5 live under `/honoraries/{n}.png`.
- **Explorer thumbnails** — Tensor’s image CDN serves a 400×500 render (~100 KB), which `next/image`
  re-encodes to AVIF/WebP (~9 KB per tile). If the CDN fails, the tile falls back to the S3 original.
  See `thumbImage()` in `lib/madlads.ts`.
- **Allowed image hosts** are listed in `next.config.ts` (`images.remotePatterns`).

## Motion

Almost all motion is **pure CSS** ([scroll-driven animations](https://developer.mozilla.org/docs/Web/CSS/CSS_scroll-driven_animations)),
defined as utilities in `app/globals.css`. Browsers without support show the content without animation, and
everything is off when the visitor asks for reduced motion.

| Utility | Effect | Used on |
| --- | --- | --- |
| `reveal` (+ `--i` for stagger) | Fade & rise into view, items one after another | Section headers, cards, perks, stats, FAQ |
| `reveal-curtain` + `reveal-zoom` | Image unveils from the bottom and settles from a slight zoom | Art, lore, news images |
| `scroll-words` / `ScrollWords` | Sentence lights up word by word while scrolling | Manifesto |
| `scroll-drift`, `scroll-push`, `scroll-darken` | Hero content drifts up, background pushes back and darkens | Homepage hero |
| `scroll-progress` | Reading progress bar | Lore page |
| `reveal-rise`, `reveal-slide` | Big elements rise / slide into place | Footer logo, statements |
| `animate-marquee` | Endless strip | Lads marquee |

**Smooth scrolling:** [Lenis](https://github.com/darkroomengineering/lenis) (`components/SmoothScroll.tsx`) on the homepage
and the Lore page. Nested scroll areas can opt out with `data-lenis-prevent`.

## Performance & accessibility

Lighthouse (mobile) on a local production build: Home 92–100, Lore 95, Mad Lads 87–95 for performance;
100 for accessibility, best practices and SEO. Choices behind it:

- Static pages; the explorer’s first 20 tiles are in the HTML before the data loads (fast LCP, no layout shift).
- `next/image` everywhere, AVIF/WebP, 30-day cache for remote images.
- The marquee only loads its images once it is on screen, so it never competes with the hero.
- Scroll reveals use CSS scroll-driven animations (no JavaScript); all motion respects `prefers-reduced-motion`.
- Two reds: brand red for large elements, a darker accessible red for small text and buttons.

## Roadmap

- **Matrica login** + holder area (needs a Matrica app / API key from the team) — `links.matricaLogin` in `data/site.ts`
- Copy review with the community manager: lore, manifesto, FAQ, perks, press facts, press email
- Fetch news automatically from the Mad News Substack (`news.madlads.com/api/v1/archive`)
- Deploy (e.g. Vercel) and measure with PageSpeed Insights

## Credits & rights

Mad Lads artwork, logos and the honorary 1/1s belong to the Mad Lads / Backpack team.
The hero video comes from the [Mad Lads Culture Hub](https://www.madlads-hub.xyz/); sketches and previews by
[@yannpenno](https://x.com/yannpenno). Confirm usage rights with the team before going public.
