import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Passport } from "@/components/passport/Passport";
import type { SharedPassport } from "@/lib/passport-share";

// A holder's shared Lads Passport, for both kinds of links (/p/<code> and /passport/<token>):
// the same reveal as in the holder area, plus a way to get your own. Its preview image: lib/passport-og.tsx.
const days = (since?: string) => (since ? Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000) : null);

export function sharedMetadata(p: SharedPassport | null): Metadata {
  if (!p) return { title: "Lads Passport", robots: { index: false } };
  const d = days(p.since);
  const title = `${p.name}’s Lads Passport`;
  const description = `${d ? `${d.toLocaleString("en-US")} days MAD. ` : ""}${p.count} MAD ${p.count === 1 ? "Lad" : "Lads"}. Fock it.`;
  return {
    title,
    description,
    robots: { index: false }, // personal page: shared by link, not listed in search
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", site: "@MadLads", title, description },
  };
}

export function SharedPassportView({ p }: { p: SharedPassport }) {
  const d = days(p.since);
  return (
    <>
      <Nav />
      <main id="main" className="bg-sunken pt-[72px] md:pt-[88px]">
        <section className="flex min-h-[calc(100svh-88px)] flex-col items-center justify-center gap-8 px-4 py-10 md:px-page">
          <header className="flex flex-col items-center gap-3 text-center">
            <p className="t-eyebrow text-accent">Lads Passport</p>
            <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[0.95] font-bold tracking-[-0.04em]">{p.name}’s passport.</h1>
            <p className="text-muted">
              {d ? `${d.toLocaleString("en-US")} days MAD · ` : ""}
              {p.count} MAD LADS
            </p>
          </header>

          <div className="w-full" style={{ "--pp-avail-h": "calc(100svh - 380px)" } as CSSProperties}>
            <Passport autoOpen data={{ ...p, lads: [] }} />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/holders">Get your Lads Passport</Button>
            <Button href="/madlads" variant="secondary">
              Explore the MAD LADS
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
