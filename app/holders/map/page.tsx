import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { HolderMap } from "@/components/holder/HolderMap";
import { RemovePin } from "@/components/holder/RemovePin";
import { getSession } from "@/lib/auth/session";
import { authMode } from "@/lib/auth/config";
import { db, getMapData, getMyPin, renewPin, PIN_MONTHS } from "@/lib/db";

// The holder map: where holders who chose to be on it live, by city. Only for logged-in holders, read on every request.
export const metadata: Metadata = {
  title: "Holder map",
  description: "Where the MAD LADS holders are. For holders only.",
  robots: { index: false },
};

export default async function HolderMapPage() {
  const session = authMode() === "off" ? null : await getSession();
  if (!session) redirect("/holders"); // /holders has the login

  // No LAD (any more): the map is closed. But someone who pinned themselves while they held one can still take the pin off.
  if (session.lads.length === 0) {
    const pin = await getMyPin(session.id).catch(() => null);
    if (!pin) redirect("/holders"); // nothing to remove: /holders says what to do without a LAD
    const country = new Intl.DisplayNames(["en"], { type: "region" }).of(pin.country) ?? pin.country;
    return (
      <>
        <Nav />
        <main id="main" className="pt-[72px] md:pt-[88px]">
          <header className="px-4 pt-10 pb-16 md:px-page md:pt-14 md:pb-24">
            <p className="t-eyebrow text-accent">Holders / Map</p>
            <h1 className="t-display-l mt-4">Your pin is still on the map.</h1>
            <div className="mt-8 flex max-w-[640px] flex-col items-start gap-8">
              <p className="t-body-l text-muted">
                This wallet no longer holds a LAD, so the map is closed to you. Your pin in {pin.city}, {country} is still there for other holders to see. You can remove it now. If you
                don’t, it disappears by itself after {PIN_MONTHS} months without a visit from a holder.
              </p>
              <RemovePin />
              <Button href="/holders" variant="secondary">
                Back to the holder area
              </Button>
            </div>
          </header>
        </main>
        <Footer />
      </>
    );
  }

  await renewPin(session.id).catch(() => {}); // a holder is here: their pin stays fresh (and an expired one comes back)

  const [data, mine] = await Promise.all([
    getMapData(session.id).catch((e) => {
      console.error("[map] could not read the map:", (e as Error).message);
      return { pins: [], cities: [], holders: 0, cityCount: 0, countryCount: 0 };
    }),
    getMyPin(session.id).catch(() => null),
  ]);

  return (
    <>
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        <header className="px-4 pt-10 pb-6 md:px-page md:pt-14 md:pb-8">
          <p className="t-eyebrow text-accent">Holders / Map</p>
          <h1 className="t-display-l mt-4">
            Where the <span className="text-red">LADS</span> are.
          </h1>
        </header>
        <div className="md:px-page lg:pb-24">
          {/* The token is read here, on the server, and only handed to a logged-in holder (it is not NEXT_PUBLIC_). */}
          <HolderMap
            token={process.env.MAPBOX_TOKEN || null}
            style={process.env.MAPBOX_STYLE || null}
            data={data}
            mine={mine}
            lad={session.photo ?? session.lads[0] ?? null}
            canSave={!!db}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
