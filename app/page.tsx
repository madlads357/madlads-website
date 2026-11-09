import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Section, SectionHeader } from "@/components/Section";
import { RosterPreview } from "@/components/RosterPreview";
import { ArtCard } from "@/components/ArtCard";
import { LogoStacked } from "@/components/Logo";
import { perks, type Perk } from "@/data/holders";
import { LadsMarquee } from "@/components/Marquee";
import { ladImage } from "@/data/lads";
import { CountUp } from "@/components/CountUp";
import { Faq } from "@/components/Faq";
import { ScrollWords } from "@/components/ScrollWords";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Intro } from "@/components/intro/Intro";
import { BeyondTheScreen } from "@/components/BeyondTheScreen";
import { LadTrail } from "@/components/LadTrail";
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { honoraries, king, moreOneOfOnes, specials } from "@/data/art";
import { chapters } from "@/data/lore";
import { getLatestNews } from "@/lib/news";
import { links } from "@/data/site";
import { HolderButton } from "@/components/HolderButton";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Intro />
      <SmoothScroll />
      <Nav overHero />
      <main id="main">
        <Hero />
        <Manifesto />
        <LadsMarquee />
        <LoreTeaser />
        <Art />
        <BackpackBand />
        <Roster />
        <Holders />
        <BeyondTheScreen />
        <News />
        <FaqSection />
      </main>
      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------- Hero */
function Hero() {
  return (
    <section className="relative isolate flex h-[100svh] max-h-[1000px] min-h-[640px] items-end overflow-hidden bg-[#1a0508] text-white">
      {/* Background video (from the Mad Lads Culture Hub). The picture under it shows while it loads
          and stays alone for people who prefer reduced motion (no poster on the video: it would load twice). */}
      {/* Background: pushes back slightly and darkens as you scroll away (CSS scroll timeline) */}
      <div className="scroll-push absolute inset-0 -z-10">
        <Image src="/video/hero-poster.jpg" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" className="object-cover" />
        <video
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          {/* AV1 (470KB) where supported, H.264 (970KB) everywhere else */}
          <source src="/video/hero-av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
          <source src="/video/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      <div className="scroll-darken absolute inset-0 -z-10 bg-black" aria-hidden />

      <div className="scroll-drift w-full px-4 pb-14 md:px-page md:pb-20">
        <h1 className="t-display-xl animate-rise">
          Everyone’s
          <br />
          <span className="text-red">MAD</span> here.
        </h1>
        <p className="t-body-l mt-7 max-w-[620px] animate-rise [animation-delay:120ms]">
          10,000 MAD LADS on Solana. Stylish, rebellious, and a little unhinged. The collection by Backpack.
        </p>
        <div className="mt-7 flex animate-rise flex-wrap gap-3 [animation-delay:220ms]">
          <Button href="/madlads" variant="inverse">
            Meet the MAD LADS
          </Button>
          <Button href="/lore" variant="inverse-outline">
            Read the Lore
          </Button>
        </div>
      </div>
      <p className="t-eyebrow scroll-drift absolute right-page bottom-20 hidden items-center gap-3 md:flex">
        Scroll
        <span className="relative block h-10 w-px overflow-hidden bg-white/30" aria-hidden>
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_1.8s_ease-in-out_infinite] bg-white" />
        </span>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ Mad Lads */
function Roster() {
  return (
    <Section id="madlads" className="grid gap-12 lg:grid-cols-[280px_1fr]">
      <div className="flex flex-col gap-5">
        <p className="t-eyebrow text-accent">04 / MAD LADS</p>
        <h2 className="t-h2">
          The MAD
          <br />
          LADS
        </h2>
        <p className="text-muted">10,000 unique LADS, Lassies and a few Skulls. Different backgrounds, same energy.</p>
        <div>
          <Button href="/madlads" variant="secondary">
            Explore all MAD LADS →
          </Button>
        </div>
      </div>
      <RosterPreview />
    </Section>
  );
}

/* ----------------------------------------------------------- Manifesto */
function Manifesto() {
  return (
    <Section tone="surface">
      <p className="t-eyebrow text-accent">01 / Manifesto</p>
      <h2 className="t-display-l reveal-slide mt-8">
        We’re not angry.
        <br />
        We’re <span className="text-red">MAD.</span>
      </h2>
      {/* Lights up word by word as you scroll */}
      <ScrollWords
        className="mt-10 max-w-[900px] text-[clamp(1.5rem,2.8vw,2.375rem)] leading-[1.25] font-semibold tracking-[-0.02em]"
        text="MAD LADS are a little louder, a little bolder, and a lot more themselves. A collection for the misfits, the risk-takers and everyone who keeps it MAD."
      />
      {/* Stats band (inspired by scrolltide.co) — numbers count up when they scroll into view */}
      <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-4">
        {[
          { to: 1000, label: "Lassies in the crew" },
          { to: 99, label: "Skulls, under 1%" },
          { to: 16, label: "Traits to explore" },
          { to: 3, label: "Years of MAD", suffix: "+" },
        ].map((s, i) => (
          <div key={s.label} className="reveal flex flex-col-reverse gap-2 bg-surface p-6 md:p-8" style={{ "--i": i } as CSSProperties}>
            <dt className="text-muted">{s.label}</dt>
            <dd className="text-[clamp(2.5rem,5vw,4rem)] leading-none font-bold tracking-[-0.04em]">
              <CountUp to={s.to} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* ---------------------------------------------------------------- Lore */
function LoreTeaser() {
  return (
    <Section id="lore">
      <SectionHeader
        eyebrow="02 / Lore"
        title="The story so far"
        text="How a crew of misfits took over Solana, told in chapters."
        action={<Button href="/lore">Read the Lore</Button>}
      />
      <ul className="grid gap-8 md:grid-cols-3">
        {chapters.slice(0, 3).map((c, i) => (
          <li key={c.slug} className="reveal" style={{ "--i": i } as CSSProperties}>
            <Link href={`/lore#${c.slug}`} className="group flex flex-col gap-4">
              <div className="reveal-curtain relative aspect-[4/3] overflow-hidden rounded-[4px] bg-sunken">
                <div className="reveal-zoom absolute inset-0">
                  <Image
                    src={c.image.src}
                    alt={c.image.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover object-[50%_45%] transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              <span className="t-eyebrow text-accent">Chapter {c.number}</span>
              <span className="t-h3 group-hover:text-accent">{c.title}</span>
              <span className="text-muted">{c.dates}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ----------------------------------------------------------------- Art */
function Art() {
  return (
    <Section id="art" tone="surface">
      <SectionHeader
        eyebrow="03 / Art"
        title="Art"
        text="The 1/1s the team drew for legends and friends, plus previews, sketches and special pieces from the MAD LADS universe."
        action={
          <Button href={links.newsletter} variant="secondary" external>
            See them all on MAD News ↗
          </Button>
        }
      />

      <SubHeader label="The 1/1s" note="Honoraries and tributes, drawn by the team." />
      <div className="grid gap-5 lg:grid-cols-2">
        <ArtCard holo piece={king} imageClass="aspect-[4/5] lg:aspect-auto lg:h-[768px]" sizes="(min-width: 1024px) 50vw, 100vw" />
        <div className="grid grid-cols-2 gap-x-5 gap-y-6">
          {honoraries.map((p, i) => (
            <ArtCard holo key={p.name} i={i + 1} piece={p} imageClass="aspect-[4/5] lg:aspect-auto lg:h-[316px]" />
          ))}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
        {moreOneOfOnes.map((p, i) => (
          <ArtCard holo key={p.name} i={i} piece={p} imageClass="aspect-[4/5]" sizes="(min-width: 1024px) 16vw, 50vw" />
        ))}
      </div>

      <div className="mt-20">
        <SubHeader label="Previews & specials" note="Sketches, previews and special drops." />
        <div className="grid gap-5 lg:grid-cols-[724fr_536fr]">
          <ArtCard piece={specials.cards} imageClass="aspect-[724/335]" sizes="(min-width: 1024px) 57vw, 100vw" />
          <ArtCard i={1} piece={specials.preview} imageClass="aspect-[536/335]" sizes="(min-width: 1024px) 43vw, 100vw" />
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-[420fr_316fr_504fr]">
          <ArtCard piece={specials.sketches} imageClass="aspect-square" sizes="(min-width: 1024px) 33vw, 50vw" />
          <ArtCard i={1} piece={specials.merch} imageClass="aspect-[3/4] lg:aspect-auto lg:h-[420px]" sizes="(min-width: 1024px) 25vw, 50vw" />
          <div className="reveal relative isolate flex min-h-[360px] flex-col justify-end gap-4 overflow-hidden rounded-[4px] bg-paper p-8 md:col-span-2 md:p-10 lg:col-span-1" style={{ "--i": 2 } as CSSProperties}>
            {/* Faint logo watermark. The opacity sits on the wrapper: the rise animation ends at opacity 1. */}
            <div className="pointer-events-none absolute -top-10 -right-24 -z-10 opacity-[0.09]" aria-hidden>
              <LogoStacked className="reveal-rise h-[560px] w-auto text-ink" title="" />
            </div>
            <p className="t-eyebrow text-accent">Behind the art</p>
            <p className="text-[40px] leading-none font-bold tracking-[-0.03em]">Every LAD starts as a sketch.</p>
            <p className="t-body-l text-muted">Previews, studies and special pieces from the artists who shape the MAD LADS universe.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function SubHeader({ label, note }: { label: string; note: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h3 className="t-h3">{label}</h3>
      <p className="text-muted">{note}</p>
    </div>
  );
}

/* ------------------------------------------------------------- Holders */
// What holding gets you (copy and photos in data/holders.ts): the crew first as the big card, then
// collabs & giveaways and the community tools. Each card is a photo with its text on a solid panel
// under it, never on top of the photo, so it stays readable.

// Blurred LADS (none of them from the marquee or the roster) scattered behind the header and the cards.
// Decorative only: phones get 2 faint tiles at the top, the rest shows from md/lg.
const holderDecor = [
  { src: ladImage(1070), cls: "top-2 left-1/2 size-20 -translate-x-1/2 -rotate-6 opacity-30 md:top-8 md:size-40 md:opacity-50" },
  { src: ladImage(905), cls: "top-4 -right-6 size-20 -rotate-6 opacity-30 md:top-6 md:right-[3%] md:size-32 md:opacity-50" },
  { src: ladImage(1337), cls: "hidden top-[45%] -left-12 size-36 rotate-6 opacity-50 lg:block" },
  { src: ladImage(6738), cls: "hidden top-[52%] -right-12 size-36 -rotate-6 opacity-50 lg:block" },
];

function HolderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" aria-hidden>
      {holderDecor.map(({ src, cls }) => (
        <div key={src} className={`absolute overflow-hidden rounded-2xl blur-sm ${cls}`}>
          <Image src={src} alt="" fill sizes="160px" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

const holderCard =
  "group/card flex h-full overflow-hidden rounded-2xl bg-surface ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(17,17,17,0.35)]";

function PerkPhoto({ perk, sizes, className }: { perk: Perk; sizes: string; className: string }) {
  return (
    <div className={`relative overflow-hidden bg-sunken ${className}`}>
      <Image src={perk.image} alt="" fill sizes={sizes} className={`object-cover transition-transform duration-700 group-hover/card:scale-105 ${perk.objectPosition ?? ""}`} />
    </div>
  );
}

function PerkText({ perk, n }: { perk: Perk; n: number }) {
  const { Icon, title, text, tags } = perk;
  return (
    <>
      <p className="flex items-center gap-2 text-accent">
        <Icon className="size-5" />
        <span className="t-eyebrow tabular-nums">0{n}</span>
      </p>
      <h3 className="t-h3 mt-3">{title}</h3>
      <p className="mt-2 max-w-[460px] text-muted">{text}</p>
      {tags && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tools">
          {tags.map((t) => (
            <li key={t} className="rounded-full bg-sunken px-3 py-1.5 text-sm font-medium">
              {t}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Holders() {
  const [crew, ...more] = perks;
  return (
    <Section id="holders" tone="sunken" className="relative isolate overflow-hidden">
      <HolderDecor />
      <div className="relative">
        <SectionHeader
          eyebrow="05 / Holders"
          title="For the holders"
          text="Hold a LAD and you’re in the crew. Log in with Backpack: one free signature, nothing sent or spent. Works with Ledger."
          action={<HolderButton />}
        />
        <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr] lg:grid-rows-2 lg:gap-6">
          {/* 01 - The crew: a big photo, the text and the Discord button under it */}
          <div className="reveal lg:row-span-2">
            <article className={`${holderCard} flex-col`}>
              <PerkPhoto perk={crew} sizes="(min-width: 1024px) 52vw, 100vw" className="aspect-[16/9] lg:aspect-auto lg:min-h-[260px] lg:flex-1" />
              <div className="p-6 md:p-8">
                <PerkText perk={crew} n={1} />
                <div className="mt-6">
                  <Button href={links.discord} external>
                    Meet the MAD LADS ↗
                  </Button>
                </div>
              </div>
            </article>
          </div>

          {/* 02, 03 - Collabs & giveaways, community tools: photo on the side from sm, on top on phones.
              Staggered only side by side (lg); stacked, each card fades in on its own. */}
          {more.map((perk, i) => (
            <div key={perk.title} className={`reveal ${i === 0 ? "lg:[--i:1]" : "lg:[--i:2]"}`}>
              <article className={`${holderCard} flex-col sm:flex-row`}>
                <PerkPhoto perk={perk} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 40vw, 100vw" className="aspect-[16/9] sm:aspect-auto sm:w-[38%] sm:shrink-0" />
                <div className="flex flex-col justify-center p-6">
                  <PerkText perk={perk} n={i + 2} />
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- News */
async function News() {
  const news = await getLatestNews(3);
  return (
    <Section id="news">
      <SectionHeader
        eyebrow="06 / News"
        title="News"
        text="The latest issues of MAD News: drops, updates and moments from the MAD world."
        action={
          <Button href={links.newsletter} variant="secondary" external>
            View all news →
          </Button>
        }
      />
      <ul className="grid gap-8 md:grid-cols-3">
        {news.map((n, i) => (
          <li key={n.href} className="reveal" style={{ "--i": i } as CSSProperties}>
            <a href={n.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-4">
              <div className="reveal-curtain relative aspect-[3/2] overflow-hidden rounded-[4px] bg-sunken">
                <div className="reveal-zoom absolute inset-0">
                  <Image src={n.image} alt={`Cover of ${n.title}`} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
              </div>
              <span className="t-eyebrow text-muted">{n.date}</span>
              <span className="t-h3 group-hover:text-accent">{n.title}</span>
              {n.subtitle && <span className="-mt-2 text-muted">{n.subtitle}</span>}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ------------------------------------------------------- Backpack band */
function BackpackBand() {
  return (
    // Moving the mouse over the band leaves a trail of random Mad Lads (desktop)
    <LadTrail className="border-y border-line bg-paper">
      <section className="flex flex-col justify-center gap-8 px-4 py-16 md:min-h-[min(88svh,820px)] md:gap-12 md:px-page md:py-40">
        <h2 className="t-display-xl reveal-slide">
          Part of the
          <br />
          <span className="text-red">Backpack</span> family.
        </h2>
        <div className="reveal flex max-w-[620px] flex-col items-start gap-7 lg:ml-auto" style={{ "--i": 1 } as CSSProperties}>
          <p className="text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.35] font-medium tracking-[-0.01em] text-muted">
            MAD LADS is the flagship collection of Backpack, the wallet and exchange built for the next generation of onchain culture.
          </p>
          <Button href={links.backpack} external>
            Learn about Backpack ↗
          </Button>
        </div>
      </section>
    </LadTrail>
  );
}

/* ----------------------------------------------------------------- FAQ */
// TODO: review the answers with the community manager.
const faq = [
  {
    q: "What is MAD LADS?",
    a: "A collection of 10,000 illustrated characters (LADS, Lassies and a few Skulls) on Solana. It launched in April 2023 as the first collection of executable NFTs (xNFTs), made by Coral, the team behind Backpack.",
  },
  {
    q: "What is the link with Backpack?",
    a: "MAD LADS is Backpack’s flagship collection. The same team builds the Backpack wallet and the Backpack exchange, and many holder events and rewards happen there.",
  },
  {
    q: "How can I get a MAD LADS?",
    a: "MAD LADS trade on NFT marketplaces such as Magic Eden and Tensor. Always check you are on the verified MAD LADS collection before buying.",
  },
  {
    q: "How do I trade a LAD peer-to-peer safely?",
    a: (
      <>
        Only use{" "}
        <a href={links.foxySwap} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2 hover:text-accent">
          FoxySwap
        </a>{" "}
        by the Famous Fox Federation: both sides lock their items and the swap only happens when both agree. Never send a LAD directly to someone, and never trust a DM offering a deal. The team will never message you first.
      </>
    ),
  },
  {
    q: "How does “Login with Backpack” work?",
    a: "You connect your Backpack wallet and sign a message that proves it’s yours. It’s free: no transaction, nothing sent or spent. We then read which MAD LADS that wallet holds on the blockchain. Using a Ledger? Tick “I use a Ledger”: you approve a free transaction on the device, which is never sent. LADS in a cold wallet? Link it once from the holder area and log in with your everyday wallet.",
  },
  {
    q: "What are the honoraries and 1/1s?",
    a: "One-of-one pieces the team drew for legends and friends of the community, like Meltem Demirors, Toly and Iggy Azalea. Some special LADS were also made for raffles and collaborations.",
  },
  {
    q: "I’m a journalist. Where are the brand assets?",
    a: "The press kit, linked in the footer, has the official logos in every format. For interviews, artwork or anything else, write to press@madlads.com.",
  },
];

function FaqSection() {
  return (
    <Section id="faq" tone="sunken">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start">
          <p className="t-eyebrow text-accent">07 / FAQ</p>
          <h2 className="t-h2">Questions, answered.</h2>
          <p className="t-body-l text-muted">New to the LADS, or writing about them? Start here.</p>
        </div>
        <Faq items={faq} />
      </div>
    </Section>
  );
}
