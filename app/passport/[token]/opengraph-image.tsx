import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { HORIZONTAL } from "@/components/Logo";
import { thumbImage } from "@/lib/madlads";
import { readShareToken } from "@/lib/passport-share";

// The preview of a shared passport on X, Discord, iMessage…: "I'm Mad." and the passport's identity page.
export const alt = "A Mad Lads holder's Lads Passport";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (file: string) => readFile(join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", file));

async function photoData(id: number) {
  try {
    const res = await fetch(thumbImage(id));
    if (!res.ok) return null;
    return `data:${res.headers.get("content-type") ?? "image/png"};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const p = readShareToken((await params).token);
  const [bold, regular, photo] = await Promise.all([font("Geist-Bold.ttf"), font("Geist-Regular.ttf"), p ? photoData(p.photo) : null]);
  const days = p?.since ? Math.floor((Date.now() - new Date(p.since).getTime()) / 86_400_000) : null;
  const red = "#f62038";
  const ink = "#d11a2e";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#b31220", fontFamily: "Geist", color: "#ffffff" }}>
        {/* left: the message */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: "60px 0 56px 64px" }}>
          <svg width={200} height={48} viewBox="0 0 334 80" fill="#ffffff">
            {HORIZONTAL.map((d) => (
              <path key={d.slice(0, 12)} d={d} />
            ))}
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -7, lineHeight: 0.9 }}>I’m Mad.</div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 700, marginTop: 26, color: "#f6f1e8" }}>{p ? `${p.name}’s Lads Passport` : "Lads Passport"}</div>
            {p && (
              <div style={{ display: "flex", fontSize: 28, marginTop: 10, color: "rgba(255,255,255,0.75)" }}>
                {`${days ? `${days.toLocaleString("en-US")} days Mad · ` : ""}${p.count} Mad ${p.count === 1 ? "Lad" : "Lads"}`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,0.7)" }}>madlads.com · Fock it.</div>
        </div>

        {/* right: the identity page, slightly tilted, with a stamp */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 400,
              height: 540,
              padding: 30,
              background: "#f6f1e8",
              borderRadius: 18,
              transform: "rotate(-4deg)",
              boxShadow: "0 30px 60px rgba(40,4,8,0.45)",
              color: "#111111",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", fontSize: 15, fontWeight: 700, letterSpacing: 4, color: "#c41129" }}>LADS PASSPORT</div>
              <svg width={92} height={22} viewBox="0 0 334 80" fill={red}>
                {HORIZONTAL.map((d) => (
                  <path key={d.slice(0, 12)} d={d} />
                ))}
              </svg>
            </div>
            <div style={{ display: "flex", marginTop: 26, gap: 22 }}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" width={190} height={238} style={{ width: 190, height: 238, borderRadius: 12, objectFit: "cover" }} />
              ) : (
                <div style={{ display: "flex", width: 190, height: 238, borderRadius: 12, background: "#ede6da" }} />
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 13, fontWeight: 700, letterSpacing: 2.5, color: "#c41129" }}>LAD NO.</div>
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1.5, marginTop: 6 }}>{p ? `#${p.photo}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", height: 1, background: "#e2dacc", marginTop: 26 }} />
            <div style={{ display: "flex", flexWrap: "wrap", marginTop: 18, rowGap: 16 }}>
              {[
                ["NAME", p?.name ?? ""],
                ["LADS HELD", String(p?.count ?? "")],
                ...(p?.since ? [["MAD SINCE", new Date(p.since).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase()]] : []),
                ...(p?.handle ? [["X", `@${p.handle}`]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", width: "50%" }}>
                  {label === "X" ? (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="#c41129">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ) : (
                    <div style={{ display: "flex", fontSize: 12, fontWeight: 700, letterSpacing: 2.5, color: "#c41129" }}>{label}</div>
                  )}
                  <div style={{ display: "flex", fontSize: 22, fontWeight: 700, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
            {/* the stamp, across the photo's corner */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: 236,
                left: 150,
                padding: "8px 18px",
                border: `5px solid ${ink}`,
                borderRadius: 10,
                color: ink,
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: -1,
                transform: "rotate(-12deg)",
                opacity: 0.92,
              }}
            >
              FOCK IT.
            </div>
          </div>
        </div>
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
