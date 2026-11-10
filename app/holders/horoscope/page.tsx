import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alegreya, Cinzel } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import { Horoscope } from "@/components/horoscope/Horoscope";
import { getSession } from "@/lib/auth/session";
import { authMode } from "@/lib/auth/config";
import { kindsOf } from "@/lib/passport-share";
import { readingFor } from "@/lib/horoscope";
import { utcDay } from "@/lib/utc-day";
import { READER, cards } from "@/data/horoscope";

// The MAD Horoscope: one reading per holder per day (UTC), from the holder's login and the date. Holders only, read on every request.
export const metadata: Metadata = {
  title: "MAD Horoscope",
  description: "Madame Fock reads your card. For holders only.",
  robots: { index: false },
};

// The look of this page is its own (a tarot caravan), so it has its own fonts.
const display = Cinzel({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-hz-display", display: "swap" });
const body = Alegreya({ subsets: ["latin"], weight: ["400", "500", "700"], style: ["normal", "italic"], variable: "--font-hz-body", display: "swap" });

export default async function HoroscopePage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const session = authMode() === "off" ? null : await getSession();
  if (!session || session.lads.length === 0) redirect("/holders"); // /holders has the login, and what to do without a LAD

  // While building (never in production): ?day=2026-11-11 shows that day's reading, to see other cards and lines.
  const { day } = await searchParams;
  const date = process.env.NODE_ENV !== "production" && day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : utcDay();
  const reading = readingFor(session.id, date, { count: session.lads.length, ...kindsOf(session.lads) });

  return (
    <div className={`${display.variable} ${body.variable}`}>
      <Horoscope
        name={session.name}
        lad={session.photo ?? session.lads[0]}
        reading={reading}
        number={cards.findIndex((c) => c.name === reading.card.name) + 1}
        reader={READER}
        site={new URL(siteUrl).host} // on the share picture: it follows NEXT_PUBLIC_SITE_URL, so it says the real address once the domain is set
      />
    </div>
  );
}
