import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MadLadsExplorer } from "@/components/MadLadsExplorer";

export const metadata: Metadata = {
  title: "The Mad Lads",
  alternates: { canonical: "/madlads" },
  description: "Explore all 9,971 Mad Lads: search by number and filter by type, background, clothing and every other trait.",
  openGraph: { title: "All 9,971 Mad Lads", description: "Explore every Mad Lad: search by number and filter by type, background, clothing and every other trait." },
  twitter: { card: "summary_large_image", site: "@MadLads", title: "All 9,971 Mad Lads", description: "Explore every Mad Lad: search by number and filter by type, background, clothing and every other trait." },
};

export default function MadLadsPage() {
  return (
    <>
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        <header className="px-4 pt-16 pb-10 md:px-page md:pt-20 md:pb-12">
          <p className="t-eyebrow text-accent">Mad Lads</p>
          <h1 className="t-display-l mt-6">The Mad Lads</h1>
          <p className="t-body-l mt-6 max-w-[640px] text-muted">
            All 9,971 Lads, Lassies, Skulls and 1/1s. Search by number, or filter by any trait.
          </p>
        </header>
        <section className="px-4 pb-24 md:px-page" aria-label="Mad Lads explorer">
          <MadLadsExplorer />
        </section>
      </main>
      <Footer />
    </>
  );
}
