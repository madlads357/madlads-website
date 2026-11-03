import type { Metadata } from "next";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { LogoStacked } from "@/components/Logo";
import { chapters, loreIntro } from "@/data/lore";
import { links } from "@/data/site";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ChapterMedia } from "@/components/lore/ChapterMedia";
import type { CSSProperties } from "react";

export const metadata: Metadata = {
  title: "Lore",
  alternates: { canonical: "/lore" },
  description: loreIntro,
  openGraph: { title: "Lore | Mad Lads", description: "From a chaotic mint in April 2023 to the Backpack token in 2026: the Mad Lads story, told in chapters." },
  twitter: { card: "summary_large_image", site: "@MadLads", title: "Lore | Mad Lads", description: "From a chaotic mint in April 2023 to the Backpack token in 2026: the Mad Lads story, told in chapters." },
};

const strip = [1070, 4144, 7245, 9866, 5655, 2784];

export default function LorePage() {
  return (
    <>
      <SmoothScroll />
      {/* Reading progress — follows the page scroll (CSS scroll timeline) */}
      <div className="scroll-progress fixed inset-x-0 top-0 z-[60] h-[3px] bg-red" aria-hidden />
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        {/* Hero */}
        <header className="px-4 pt-16 pb-12 md:px-page md:pt-24 md:pb-16">
          <p className="t-eyebrow text-accent">Lore</p>
          <h1 className="t-display-xl mt-8">
            The story
            <br />
            so far.
          </h1>
          <p className="t-body-l mt-8 max-w-[640px] text-muted">{loreIntro}</p>

          <nav aria-label="Chapters" className="mt-12 border-y border-line">
            <ol className="grid grid-cols-2 sm:grid-cols-3">
              {chapters.map((c) => (
                <li key={c.slug}>
                  <a href={`#${c.slug}`} className="group flex flex-col gap-1.5 py-5 pr-4">
                    <span className="t-eyebrow text-accent">{c.number}</span>
                    <span className="text-lg font-semibold tracking-tight group-hover:text-accent">{c.title}</span>
                    <span className="text-sm text-muted">{c.dates}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        {/* Art strip */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-10 md:grid-cols-6 md:gap-3 md:px-page" aria-hidden>
          {strip.map((id, i) => (
            <div key={id} className="reveal relative aspect-[4/5] overflow-hidden rounded-[4px] bg-sunken" style={{ "--i": i } as CSSProperties}>
              <Image src={`/lads/${id}.jpg`} alt="" fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover" />
            </div>
          ))}
        </div>

        {/* Chapters */}
        <div className="flex flex-col gap-24 px-4 py-20 md:gap-36 md:px-page md:py-section">
          {chapters.map((c, i) => (
            <article id={c.slug} key={c.slug} className="scroll-mt-28">
            <div className="grid items-center gap-10 lg:grid-cols-[560px_1fr] lg:gap-20">
              <div className={`reveal-curtain relative aspect-[560/680] overflow-hidden rounded-[4px] bg-sunken ${i % 2 ? "lg:order-2" : ""}`}>
                <div className="reveal-zoom absolute inset-0">
                  <Image src={c.image.src} alt={c.image.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
                </div>
              </div>
              <div className="reveal flex flex-col gap-5" style={{ "--i": 1 } as CSSProperties}>
                <p className="t-eyebrow text-accent">Chapter {c.number}</p>
                <h2 className="text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.04em]">{c.title}</h2>
                <p className="font-semibold text-muted">{c.dates}</p>
                <p className="t-body-l">{c.body}</p>
                <ul className="mt-2 flex flex-col border-t border-line">
                  {c.moments.map((m) => {
                    const [when, what] = m.includes(" — ") ? m.split(" — ") : [null, m];
                    return (
                      <li key={m} className="flex gap-4 border-b border-line py-3 text-muted">
                        {when && <span className="w-28 shrink-0 font-semibold text-ink">{when}</span>}
                        <span>{what}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
              {/* Photos, press and posts from that time */}
              {c.media.length > 0 && (
                <div className="mt-12 md:mt-16">
                  <ChapterMedia media={c.media} label={`Chapter ${c.number} · ${c.dates}`} />
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Motto band */}
        <section className="relative isolate overflow-hidden bg-accent px-4 py-24 text-white md:px-page md:py-32">
          <LogoStacked className="absolute top-1/2 -right-20 -z-10 h-[140%] w-auto -translate-y-1/2 text-ink opacity-25" title="" />
          <p className="t-eyebrow">The motto</p>
          <p className="reveal-slide mt-6 text-[clamp(4rem,14vw,12rem)] leading-[0.85] font-bold tracking-[-0.05em]">Fock it.</p>
          <p className="t-body-l mt-6 max-w-[520px]">It’s the description of every single Mad Lad onchain. The rest of the story is still being written.</p>
        </section>

        {/* Keep reading */}
        <section className="flex flex-col gap-8 px-4 py-20 md:flex-row md:items-end md:justify-between md:px-page md:py-section">
          <div className="reveal flex max-w-[640px] flex-col gap-4">
            <p className="t-eyebrow text-accent">Keep reading</p>
            <h2 className="t-h2">The story continues every month in Mad News.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href={links.newsletter} external>
              Subscribe to Mad News ↗
            </Button>
            <Button href="/" variant="secondary">
              Back home
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
