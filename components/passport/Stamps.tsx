// The rubber stamps of the Lads Passport, drawn in SVG (single ink colour = currentColor).
// The worn-ink look comes from the .pp-ink mask in passport.css, not from these shapes.
import { useId, type ReactNode } from "react";

const font = { fontFamily: "var(--font-sans)", fontWeight: 800 } as const;

// Shrinks long words so they fit a given width (rough: bold caps ≈ 0.62em per letter).
const fit = (text: string, width: number, max: number) => Math.min(max, width / (text.length * 0.62));

function Svg({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" fill="none" stroke="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

export function FockIt() {
  return (
    <Svg w={260} h={104}>
      <rect x="4" y="4" width="252" height="96" rx="12" strokeWidth="7" />
      <rect x="15" y="15" width="230" height="74" rx="6" strokeWidth="2.5" />
      <text x="130" y="72" textAnchor="middle" fill="currentColor" stroke="none" fontSize="54" letterSpacing="-1" style={font}>
        FOCK IT.
      </text>
    </Svg>
  );
}

// Round seal: "MAD LADS · HOLDER" around, the year in the middle.
export function HolderSeal({ year }: { year: string }) {
  const ring = useId(); // unique per seal: the passport can render twice (mobile + desktop)
  return (
    <Svg w={200} h={200}>
      <defs>
        <path id={ring} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="94" strokeWidth="6" />
      <circle cx="100" cy="100" r="64" strokeWidth="2.5" />
      <text fill="currentColor" stroke="none" fontSize="18" style={font}>
        <textPath href={`#${ring}`} textLength="480" lengthAdjust="spacing">MAD LADS · HOLDER · MAD LADS · HOLDER · </textPath>
      </text>
      <text x="100" y="92" textAnchor="middle" fill="currentColor" stroke="none" fontSize="15" letterSpacing="3" style={font}>
        SINCE
      </text>
      <text x="100" y="128" textAnchor="middle" fill="currentColor" stroke="none" fontSize="38" style={font}>
        {year}
      </text>
    </Svg>
  );
}

// How many Lads: HOLDER (1–4), CREW (5+), LEGEND (20+).
export function Tier({ count }: { count: number }) {
  const word = count >= 20 ? "LEGEND" : count >= 5 ? "CREW" : "HOLDER";
  return (
    <Svg w={220} h={120}>
      <rect x="4" y="4" width="212" height="112" rx="4" strokeWidth="6" />
      <line x1="20" y1="76" x2="200" y2="76" strokeWidth="2.5" strokeDasharray="6 6" />
      <text x="110" y="62" textAnchor="middle" fill="currentColor" stroke="none" fontSize={fit(word, 180, 48)} style={font}>
        {word}
      </text>
      <text x="110" y="102" textAnchor="middle" fill="currentColor" stroke="none" fontSize="20" letterSpacing="3" style={font}>
        {count} {count === 1 ? "LAD" : "LADS"}
      </text>
    </Svg>
  );
}

export function SkullClub() {
  return (
    <Svg w={170} h={190}>
      {/* skull outline */}
      <path d="M85 14c-36 0-62 25-62 58 0 19 8 33 22 42v20c0 6 4 10 10 10h60c6 0 10-4 10-10v-20c14-9 22-23 22-42 0-33-26-58-62-58Z" strokeWidth="6" strokeLinejoin="round" />
      <circle cx="61" cy="78" r="14" fill="currentColor" stroke="none" />
      <circle cx="109" cy="78" r="14" fill="currentColor" stroke="none" />
      <path d="M85 98l-8 14h16Z" fill="currentColor" stroke="none" />
      <path d="M68 126v18M85 126v18M102 126v18" strokeWidth="4" />
      <text x="85" y="182" textAnchor="middle" fill="currentColor" stroke="none" fontSize="24" letterSpacing="2" style={font}>
        SKULL CLUB
      </text>
    </Svg>
  );
}

// Gold seal for holders of a 1/1. Drawn in two golds, so it skips the single-ink colour.
export function OneOfOne() {
  const points = Array.from({ length: 48 }, (_, i) => {
    const r = i % 2 ? 84 : 96;
    const a = (i / 48) * Math.PI * 2;
    return `${(100 + r * Math.cos(a)).toFixed(2)},${(100 + r * Math.sin(a)).toFixed(2)}`; // rounded: same on server and browser
  }).join(" ");
  return (
    <Svg w={200} h={200}>
      <polygon points={points} fill="#d8a93a" stroke="none" />
      <circle cx="100" cy="100" r="70" stroke="#8a6414" strokeWidth="3" />
      <circle cx="100" cy="100" r="62" stroke="#8a6414" strokeWidth="1.5" strokeDasharray="3 4" />
      <text x="100" y="118" textAnchor="middle" fill="#5a3f08" stroke="none" fontSize="54" style={font}>
        1/1
      </text>
      <text x="100" y="146" textAnchor="middle" fill="#5a3f08" stroke="none" fontSize="12" letterSpacing="3" style={font}>
        HOLDER
      </text>
    </Svg>
  );
}

export function Lassie() {
  return (
    <Svg w={230} h={120}>
      <ellipse cx="115" cy="60" rx="110" ry="55" strokeWidth="6" />
      <ellipse cx="115" cy="60" rx="96" ry="43" strokeWidth="2" />
      <text x="115" y="62" textAnchor="middle" fill="currentColor" stroke="none" fontSize="38" style={font}>
        LASSIE
      </text>
      <text x="115" y="86" textAnchor="middle" fill="currentColor" stroke="none" fontSize="14" letterSpacing="4" style={font}>
        IN THE CREW
      </text>
    </Svg>
  );
}

// A Mad Lads Discord role. Alternates hexagon / triangle so several roles don't look alike.
export function Role({ name, shape }: { name: string; shape: "hex" | "tri" }) {
  const text = name.toUpperCase();
  return shape === "hex" ? (
    <Svg w={200} h={180}>
      <polygon points="50,6 150,6 196,90 150,174 50,174 4,90" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="58,20 142,20 180,90 142,160 58,160 20,90" strokeWidth="2" strokeLinejoin="round" />
      <text x="100" y="80" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" letterSpacing="3" style={font}>
        ROLE
      </text>
      <text x="100" y="116" textAnchor="middle" fill="currentColor" stroke="none" fontSize={fit(text, 130, 40)} style={font}>
        {text}
      </text>
    </Svg>
  ) : (
    <Svg w={220} h={190}>
      <polygon points="110,8 214,184 6,184" strokeWidth="6" strokeLinejoin="round" />
      <text x="110" y="124" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" letterSpacing="3" style={font}>
        ROLE
      </text>
      <text x="110" y="160" textAnchor="middle" fill="currentColor" stroke="none" fontSize={fit(text, 120, 30)} style={font}>
        {text}
      </text>
    </Svg>
  );
}

// Date the passport was looked at, like an entry stamp.
export function Issued({ date }: { date: string }) {
  return (
    <Svg w={210} h={96}>
      <rect x="4" y="4" width="202" height="88" rx="8" strokeWidth="4" />
      <text x="105" y="30" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" letterSpacing="4" style={font}>
        ISSUED
      </text>
      <text x="105" y="62" textAnchor="middle" fill="currentColor" stroke="none" fontSize="28" style={font}>
        {date}
      </text>
      <text x="105" y="82" textAnchor="middle" fill="currentColor" stroke="none" fontSize="11" letterSpacing="3" style={font}>
        MADLADS.COM
      </text>
    </Svg>
  );
}
