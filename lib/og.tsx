// Shared renderer for the link-preview images (Open Graph / X / Discord), 1200×630.
// Used by each route's opengraph-image.tsx and twitter-image.tsx; generated at build time.
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { HORIZONTAL } from "@/components/Logo";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// Literal paths only: dynamic paths would make the bundler trace (and ship) the whole project.
const fontBold = () => readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Bold.ttf"));
const fontRegular = () => readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf"));
const toDataUrl = (b: Buffer) => `data:image/jpeg;base64,${b.toString("base64")}`;

// `images`: JPEG buffers, read by each route with a literal path (see app/**/opengraph-image.tsx).
export async function renderOg({ eyebrow, title, subtitle, images }: { eyebrow: string; title: string; subtitle: string; images: Promise<Buffer>[] }) {
  const [bold, regular, ...bufs] = await Promise.all([fontBold(), fontRegular(), ...images]);
  const pics = bufs.map(toDataUrl);
  const grid = pics.length > 1;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#111111", fontFamily: "Geist" }}>
        <div style={{ width: 14, height: "100%", background: "#f62038", display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px 52px 58px" }}>
          <svg width={184} height={44} viewBox="0 0 334 80" fill="#ffffff">
            {HORIZONTAL.map((d) => (
              <path key={d.slice(0, 12)} d={d} />
            ))}
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#f62038", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{eyebrow}</div>
            <div style={{ display: "flex", color: "#ffffff", fontSize: 80, fontWeight: 700, lineHeight: 0.95, letterSpacing: -3, marginTop: 18, maxWidth: 600 }}>{title}</div>
            <div style={{ display: "flex", color: "#b9b2a6", fontSize: 28, fontWeight: 400, lineHeight: 1.35, marginTop: 22, maxWidth: 560 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", color: "#8f877c", fontSize: 22 }}>madlads.com</div>
        </div>
        <div style={{ width: 470, height: "100%", display: "flex", flexWrap: "wrap" }}>
          {pics.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" width={grid ? 235 : 470} height={grid ? 315 : 630} style={{ objectFit: "cover", width: grid ? 235 : 470, height: grid ? 315 : 630 }} />
          ))}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
