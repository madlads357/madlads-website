// Renders the README images from the real site, with your installed Chrome (puppeteer-core):
//   docs/images/hero.png           desktop homepage, top of the page (after the intro)
//   docs/images/page-*.png         Lore, the Mad Lads explorer and the holder profile, desktop
//   docs/images/strip.png          the four pages on a phone, side by side
//
// The holder profile needs a logged-in test holder, which only exists in development:
//   1. put AUTH_MOCK=1 in .env.local (see .env.example)
//   2. npm run dev
//   3. npm run screenshots                         (uses http://localhost:3000)
//      SITE=http://localhost:3211 npm run screenshots
//      CHROME_PATH="C:/path/to/chrome.exe" npm run screenshots
// Without AUTH_MOCK the holder shots are skipped.
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "docs", "images");
const SITE = process.env.SITE ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].find((p) => existsSync(p));
if (!CHROME) throw new Error("Chrome not found: set CHROME_PATH.");

const DESKTOP = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--hide-scrollbars"] });

/** Log in as the development test holder (cookies stay in the browser's default context). */
async function loginAsTestHolder() {
  const page = await browser.newPage();
  const res = await page.goto(`${SITE}/api/auth/login?as=holder`, { waitUntil: "networkidle0", timeout: 60_000 });
  const loggedIn = res?.url().endsWith("/holders") && (await page.evaluate(() => document.cookie.includes("ml_user")));
  await page.close();
  return !!loggedIn;
}

/**
 * Load a page, let its entrance animations finish, return a PNG of the viewport.
 * Hides the Next.js dev badge and the intro overlay, so the shot is the page itself.
 */
async function capture(path, viewport, { height = viewport.height, wait = 3500 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, height });
  await page.goto(SITE + path, { waitUntil: "networkidle0", timeout: 90_000 });
  await page.addStyleTag({ content: "nextjs-portal, [data-nextjs-toast] { display: none !important; }" });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, wait)); // intro (1.8 s), then the entrance animations
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return png;
}

const save = (png, name) => sharp(png).png({ palette: true, compressionLevel: 9 }).toFile(join(out, name));

await mkdir(out, { recursive: true });

console.log("hero");
await save(await capture("/", DESKTOP, { height: 960, wait: 6000 }), "hero.png");

const phones = [await capture("/", PHONE, { wait: 6000 })];

console.log("lore");
await save(await capture("/lore", DESKTOP), "page-lore.png");
phones.push(await capture("/lore", PHONE));

console.log("madlads");
await save(await capture("/madlads", DESKTOP, { wait: 5000 }), "page-madlads.png");
phones.push(await capture("/madlads", PHONE, { wait: 5000 }));

console.log("holders");
if (await loginAsTestHolder()) {
  await save(await capture("/holders", DESKTOP), "page-holders.png");
  phones.push(await capture("/holders", PHONE));
} else {
  console.warn("Test login unavailable (needs `npm run dev` and AUTH_MOCK=1): skipping the holder shots.");
}
await browser.close();

// Phone strip: the screens with rounded corners and a gap, on the site's ink colour.
const W = PHONE.width * 2;
const H = PHONE.height * 2;
const GAP = 56;
const R = 48;
const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${R}" ry="${R}"/></svg>`);
const framed = await Promise.all(phones.map((png) => sharp(png).resize(W, H).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer()));
const strip = await sharp({
  create: { width: W * framed.length + GAP * (framed.length + 1), height: H + GAP * 2, channels: 4, background: "#111111" },
})
  .composite(framed.map((input, i) => ({ input, left: GAP + i * (W + GAP), top: GAP })))
  .png()
  .toBuffer();
await sharp(strip).resize({ width: 2000 }).png({ palette: true, compressionLevel: 9 }).toFile(join(out, "strip.png"));

console.log("done →", out);
