import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Passport } from "@/components/passport/Passport";
import { readShareToken } from "@/lib/passport-share";

// A holder's shared Lads Passport. The link carries the passport (signed, see lib/passport-share.ts);
// the page plays the same reveal as in the holder area, and its preview image shows on X and Discord.
type Props = { params: Promise<{ token: string }> };

const days = (since?: string) => (since ? Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = readShareToken((await params).token);
  if (!p) return { title: "Lads Passport", robots: { index: false } };
  const d = days(p.since);
  const title = `${p.name}’s Lads Passport`;
  const description = `${d ? `${d.toLocaleString("en-US")} days Mad. ` : ""}${p.count} Mad ${p.count === 1 ? "Lad" : "Lads"}. Fock it.`;
  return {
    title,
    description,
    robots: { index: false }, // personal page: shared by link, not listed in search
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", site: "@MadLads", title, description },
  };
}

export default async function SharedPassportPage({ params }: Props) {
  const p = readShareToken((await params).token);
  if (!p) notFound();
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
              {d ? `${d.toLocaleString("en-US")} days Mad · ` : ""}
              {p.count} Mad {p.count === 1 ? "Lad" : "Lads"}
            </p>
          </header>

          <div className="w-full" style={{ "--pp-avail-h": "calc(100svh - 380px)" } as CSSProperties}>
            <Passport autoOpen data={{ ...p, lads: [] }} />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button href="/holders">Get your Lads Passport</Button>
            <Button href="/madlads" variant="secondary">
              Explore the Mad Lads
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
