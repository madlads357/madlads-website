// One stamp per Mad Lads Discord role (the role names come from MADLADS_STAMP_ROLES). A role without a design of
// its own here gets the generic hexagon / triangle from Stamps.tsx.
import { useId, type ReactElement } from "react";
import { Label, Svg, fit, font, starPoints } from "./stamp-kit";
import { Role, SkullClub } from "./Stamps";

const CROWN = "M6 54L0 10L28 32L50 0L72 32L100 10L94 54Z";
const SPADE = "M50 4C50 4 4 40 4 66a24 24 0 0 0 42 16c0 14-4 24-12 32h32c-8-8-12-18-12-32a24 24 0 0 0 42-16C96 40 50 4 50 4Z";

function King() {
  return (
    <Svg w={200} h={210}>
      <path d="M20 40H180V110C180 150 140 180 100 198C60 180 20 150 20 110Z" strokeWidth="6" strokeLinejoin="round" />
      <path d="M100 4V34M86 18H114" strokeWidth="7" strokeLinecap="round" />
      <Label x={100} y={96} size={13} spacing={4}>MAD LADS</Label>
      <Label x={100} y={140} size={fit("KING", 120, 46)}>KING</Label>
    </Svg>
  );
}

function Duke() {
  return (
    <Svg w={200} h={200}>
      <polygon points="100,6 194,100 100,194 6,100" strokeWidth="6" strokeLinejoin="round" />
      <polygon points="100,24 176,100 100,176 24,100" strokeWidth="2" strokeLinejoin="round" />
      <Label x={100} y={80} size={13} spacing={4}>MAD</Label>
      <Label x={100} y={122} size={fit("DUKE", 100, 40)}>DUKE</Label>
    </Svg>
  );
}

function Baron() {
  return (
    <Svg w={220} h={170}>
      <path d="M6 8H214V150L110 120L6 150Z" strokeWidth="6" strokeLinejoin="round" />
      <path d="M20 26H200" strokeWidth="2" />
      <Label x={110} y={78} size={fit("BARON", 170, 46)}>BARON</Label>
      {[90, 110, 130].map((cx) => (
        <circle key={cx} cx={cx} cy={100} r={4.5} fill="currentColor" stroke="none" />
      ))}
    </Svg>
  );
}

function Lord() {
  return (
    <Svg w={180} h={210}>
      <path d="M10 200V90a80 80 0 0 1 160 0V200Z" strokeWidth="6" strokeLinejoin="round" />
      <path d="M24 188V92a66 66 0 0 1 132 0V188Z" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="90" cy="62" r="9" fill="currentColor" stroke="none" />
      <path d="M90 76V94" strokeWidth="4" strokeLinecap="round" />
      <Label x={90} y={140} size={fit("LORD", 110, 40)}>LORD</Label>
    </Svg>
  );
}

function Creator() {
  return (
    <Svg w={200} h={200}>
      <rect x="14" y="14" width="172" height="172" rx="18" strokeWidth="6" />
      <path d="M100 34C104 58 110 64 134 68C110 72 104 78 100 102C96 78 90 72 66 68C90 64 96 58 100 34Z" fill="currentColor" stroke="none" />
      <path d="M142 112l6 12 12 6-12 6-6 12-6-12-12-6 12-6Z" fill="currentColor" stroke="none" />
      <Label x={100} y={152} size={fit("CREATOR", 150, 32)}>CREATOR</Label>
    </Svg>
  );
}

function Crown() {
  const ring = useId();
  return (
    <Svg w={200} h={200}>
      <defs>
        <path id={ring} d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="94" strokeWidth="6" />
      <circle cx="100" cy="100" r="58" strokeWidth="2.5" />
      <text fill="currentColor" stroke="none" fontSize="17" style={font}>
        <textPath href={`#${ring}`} textLength="448" lengthAdjust="spacing">CROWN · CROWN · CROWN · CROWN · </textPath>
      </text>
      <g transform="translate(60 76) scale(0.8)">
        <path d={CROWN} strokeWidth="6" strokeLinejoin="round" />
        <path d="M4 66H96" strokeWidth="6" strokeLinecap="round" />
      </g>
    </Svg>
  );
}

function Galaxy() {
  return (
    <Svg w={220} h={175}>
      <ellipse cx="110" cy="72" rx="106" ry="66" strokeWidth="6" />
      <ellipse cx="110" cy="72" rx="80" ry="22" strokeWidth="2.5" transform="rotate(-20 110 72)" />
      <ellipse cx="110" cy="72" rx="52" ry="12" strokeWidth="2" transform="rotate(25 110 72)" />
      <circle cx="110" cy="72" r="11" fill="currentColor" stroke="none" />
      {[[48, 44, 3.5], [172, 98, 3.5], [160, 38, 2.5], [60, 104, 2.5], [88, 30, 2]].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="currentColor" stroke="none" />
      ))}
      <Label x={110} y={166} size={fit("GALAXY", 150, 30)} spacing={3}>GALAXY</Label>
    </Svg>
  );
}

function LassieRole() {
  return (
    <Svg w={200} h={190}>
      <path d="M100 182C14 120 10 52 56 36C80 28 98 42 100 58C102 42 120 28 144 36C190 52 186 120 100 182Z" strokeWidth="6" strokeLinejoin="round" />
      <Label x={100} y={100} size={fit("LASSIE", 120, 32)}>LASSIE</Label>
      <Label x={100} y={122} size={11} spacing={3}>ROLE</Label>
    </Svg>
  );
}

function AI() {
  return (
    <Svg w={200} h={200}>
      <rect x="40" y="40" width="120" height="120" rx="14" strokeWidth="6" />
      <path d="M70 40V14M100 40V14M130 40V14M70 160V186M100 160V186M130 160V186M40 70H14M40 100H14M40 130H14M160 70H186M160 100H186M160 130H186" strokeWidth="6" strokeLinecap="round" />
      <Label x={100} y={122} size={58}>AI</Label>
    </Svg>
  );
}

function Pokerface() {
  return (
    <Svg w={170} h={230}>
      <rect x="8" y="8" width="154" height="214" rx="14" strokeWidth="6" />
      <rect x="20" y="20" width="130" height="190" rx="8" strokeWidth="2" />
      <g transform="translate(35 46)">
        <path d={SPADE} fill="currentColor" stroke="none" />
      </g>
      <Label x={85} y={192} size={fit("POKERFACE", 124, 22)}>POKERFACE</Label>
    </Svg>
  );
}

function LadsOfTheMonth() {
  return (
    <Svg w={220} h={200}>
      <rect x="8" y="24" width="204" height="168" rx="12" strokeWidth="6" />
      <path d="M8 66H212" strokeWidth="4" />
      <path d="M62 10V38M158 10V38" strokeWidth="9" strokeLinecap="round" />
      <polygon points={starPoints(110, 45, 5, 12, 5)} fill="currentColor" stroke="none" />
      <Label x={110} y={102} size={fit("LADS OF THE", 170, 28)}>LADS OF THE</Label>
      <Label x={110} y={154} size={fit("MONTH", 170, 50)}>MONTH</Label>
    </Svg>
  );
}

function Consigliere() {
  return (
    <Svg w={220} h={200}>
      <polygon points={starPoints(110, 100, 36, 98, 88)} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="110" cy="100" r="72" strokeWidth="2" />
      <Label x={110} y={78} size={11} spacing={4}>THE FAMILY</Label>
      <Label x={110} y={112} size={fit("CONSIGLIERE", 130, 24)}>CONSIGLIERE</Label>
      <path d="M70 128H150" strokeWidth="2.5" strokeDasharray="5 5" />
    </Svg>
  );
}

function MadMods() {
  return (
    <Svg w={200} h={200}>
      <polygon points={starPoints(100, 100, 6, 96, 66)} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="46" strokeWidth="2.5" />
      <Label x={100} y={92} size={20} spacing={3}>MAD</Label>
      <Label x={100} y={122} size={fit("MODS", 70, 30)}>MODS</Label>
    </Svg>
  );
}

const DESIGNS: Record<string, () => ReactElement> = {
  king: King,
  skull: SkullClub, // the Skull role is the Skull Club stamp
  duke: Duke,
  baron: Baron,
  lord: Lord,
  creator: Creator,
  crown: Crown,
  galaxy: Galaxy,
  lassie: LassieRole,
  ai: AI,
  pokerface: Pokerface,
  "lads of the month": LadsOfTheMonth,
  consigliere: Consigliere,
  "mad mods": MadMods,
};

// The stamp for a role: its own design, or the generic one (hexagon / triangle, alternating).
export function RoleStamp({ name, index }: { name: string; index: number }) {
  const Design = DESIGNS[name.trim().toLowerCase()];
  return Design ? <Design /> : <Role name={name} shape={index % 2 ? "tri" : "hex"} />;
}
