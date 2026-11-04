import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { HORIZONTAL } from "@/components/Logo";
import { originalImage, thumbImage } from "@/lib/madlads";
import { collection, ladTraits } from "@/lib/madlads-server";

// Link preview of one Lad's page: the Lad large on the right, its number and key traits on the left.
// Made the first time it is asked for, then kept.
export const alt = "A MAD LADS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file));

// The original (2048×2560) shrunk to the preview size; the CDN thumbnail if the original is unavailable.
async function picture(id: number): Promise<string | null> {
  try {
    const res = await fetch(originalImage(id));
    if (!res.ok) throw new Error(String(res.status));
    const jpg = await sharp(Buffer.from(await res.arrayBuffer())).resize(504, 630, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    const res = await fetch(thumbImage(id)).catch(() => null);
    if (!res?.ok) return null;
    return `data:${res.headers.get("content-type") ?? "image/png"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const traits = collection().byId.has(id) ? ladTraits(id)! : [];
  const [bold, regular, pic] = await Promise.all([font("Geist-Bold.ttf"), font("Geist-Regular.ttf"), traits.length ? picture(id) : null]);
  const type = traits.find((t) => t.name === "Type")?.value;
  const gender = traits.find((t) => t.name === "Gender")?.value;
  const rarest = traits.filter((t) => t.name !== "Gender").sort((a, b) => a.share - b.share).slice(0, 3);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#111111", fontFamily: "Geist", color: "#ffffff" }}>
        <div style={{ width: 14, height: "100%", background: "#f62038", display: "flex" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 48px 52px 58px" }}>
          <svg width={184} height={44} viewBox="0 0 334 80" fill="#ffffff">
            {HORIZONTAL.map((d) => (
              <path key={d.slice(0, 12)} d={d} />
            ))}
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#f62038", fontSize: 24, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>MAD LADS</div>
            <div style={{ display: "flex", fontSize: 128, fontWeight: 700, letterSpacing: -5, lineHeight: 0.95, marginTop: 10 }}>{`#${id}`}</div>
            <div style={{ display: "flex", color: "#b9b2a6", fontSize: 30, marginTop: 14 }}>{[type, gender].filter(Boolean).join(" · ")}</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 30, gap: 10 }}>
              {rarest.map((t) => (
                <div key={t.name} style={{ display: "flex", fontSize: 24, color: "#e8e2d8" }}>
                  <span style={{ color: "#8f877c", width: 170 }}>{t.name}</span>
                  <span style={{ fontWeight: 700 }}>{t.value}</span>
                  <span style={{ color: "#8f877c", marginLeft: 12 }}>{t.count === 1 ? "1 of 1" : `${(t.share * 100).toFixed(t.share < 0.01 ? 2 : 1)}%`}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", color: "#8f877c", fontSize: 22 }}>madlads.com</div>
        </div>
        {pic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pic} alt="" width={504} height={630} style={{ width: 504, height: 630, objectFit: "cover" }} />
        ) : (
          <div style={{ width: 504, height: 630, display: "flex", background: "#1d1b1a" }} />
        )}
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: bold, weight: 700, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
