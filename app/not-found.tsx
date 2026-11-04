import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { LadTrail } from "@/components/LadTrail";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

// Custom 404 in the Mad Lads style.
export default function NotFound() {
  return (
    <>
      <Nav />
      <LadTrail>
        <main id="main" className="relative pt-[72px] md:pt-[88px]">
          <section className="grid min-h-[calc(100svh-88px)] items-center gap-12 px-4 py-16 md:px-page lg:grid-cols-[1.2fr_1fr] lg:gap-20">
            <div className="flex flex-col gap-6">
              <p className="t-eyebrow text-accent">Error 404</p>
              <h1 className="text-[clamp(6rem,20vw,16rem)] leading-[0.8] font-bold tracking-[-0.06em]">
                4<span className="text-red">0</span>4
              </h1>
              <p className="t-h2 max-w-[560px]">This Lad got lost.</p>
              <p className="t-body-l max-w-[520px] text-muted">
                Fock it. The page you’re looking for doesn’t exist, moved, or was never minted. Head back home or go find a Lad who knows the way.
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <Button href="/">Back home</Button>
                <Button href="/madlads" variant="secondary">
                  Explore the MAD LADS →
                </Button>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[420px]">
              <div className="absolute -inset-6 -z-10 rotate-6 rounded-3xl bg-red/90" aria-hidden />
              <figure className="relative aspect-[4/5] -rotate-3 overflow-hidden rounded-2xl ring-1 ring-black/10 shadow-[0_30px_60px_-25px_rgba(17,17,17,0.6)]">
                <Image src="/lads/1846.jpg" alt="Mad Skull #1846 looking unimpressed" fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 420px, 80vw" className="object-cover" />
                <figcaption className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1.5 text-xs font-semibold">#1846 · also lost</figcaption>
              </figure>
            </div>
          </section>
        </main>
      </LadTrail>
      <Footer />
    </>
  );
}
