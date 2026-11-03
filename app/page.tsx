import Image from "next/image";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Section, SectionHeader } from "@/components/Section";
import { RosterPreview } from "@/components/RosterPreview";
import { ArtCard } from "@/components/ArtCard";
import { LogoStacked } from "@/components/Logo";
import { CrownIcon, GiftIcon, LockIcon, TicketIcon, UsersIcon } from "@/components/Icons";
import { LadsMarquee } from "@/components/Marquee";
import { CountUp } from "@/components/CountUp";
import { Faq } from "@/components/Faq";
import { ScrollWords } from "@/components/ScrollWords";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Intro } from "@/components/intro/Intro";
import { BeyondTheScreen } from "@/components/BeyondTheScreen";
import { LadTrail } from "@/components/LadTrail";
import type { CSSProperties } from "react";
import { honoraries, king, moreOneOfOnes, specials } from "@/data/art";
import { chapters } from "@/data/lore";
import { getLatestNews } from "@/lib/news";
import { links } from "@/data/site";

export default function Home() {
  return (
    <>
      <Intro />
      <SmoothScroll />
      <Nav overHero />
      <main id="main">
        <Hero />
        <Roster />
        <Manifesto />
        <LadsMarquee />
        <LoreTeaser />
        <Art />
        <Holders />
        <BeyondTheScreen />
        <News />
        <BackpackBand />
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
      {/* Background video (from the Mad Lads Culture Hub). The poster shows while it loads
          and stays alone for people who prefer reduced motion. */}
      {/* Background: pushes back slightly and darkens as you scroll away (CSS scroll timeline) */}
      <div className="scroll-push absolute inset-0 -z-10">
        <Image src="/video/hero-poster.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <video
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          src="/video/hero.mp4"
          poster="/video/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
      <div className="scroll-darken absolute inset-0 -z-10 bg-black" aria-hidden />

      <div className="scroll-drift w-full px-4 pb-14 md:px-page md:pb-20">
        <h1 className="t-display-xl animate-rise">
          Everyone’s
          <br />
          <span className="text-red">mad</span> here.
        </h1>
        <p className="t-body-l mt-7 max-w-[620px] animate-rise [animation-delay:120ms]">
          10,000 Mad Lads on Solana. Stylish, rebellious, and a little unhinged. The collection by Backpack.
        </p>
        <div className="mt-7 flex animate-rise flex-wrap gap-3 [animation-delay:220ms]">
          <Button href="/madlads" variant="inverse">
            Meet the Mad Lads
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
        <p className="t-eyebrow text-accent">01 / Mad Lads</p>
        <h2 className="t-h2">
          The Mad
          <br />
          Lads
        </h2>
        <p className="text-muted">10,000 unique Lads, Lassies and a few Skulls. Different backgrounds, same energy.</p>
        <div>
          <Button href="/madlads" variant="secondary">
            Explore all Mad Lads →
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
      <p className="t-eyebrow text-accent">02 / Manifesto</p>
      <h2 className="t-display-l reveal-slide mt-8">
        We’re not angry.
        <br />
        We’re <span className="text-red">Mad.</span>
      </h2>
      {/* Lights up word by word as you scroll */}
      <ScrollWords
        className="mt-10 max-w-[900px] text-[clamp(1.5rem,2.8vw,2.375rem)] leading-[1.25] font-semibold tracking-[-0.02em]"
        text="Mad Lads are a little louder, a little bolder, and a lot more themselves. A collection for the misfits, the risk-takers and everyone who keeps it Mad."
      />
      {/* Stats band (inspired by scrolltide.co) — numbers count up when they scroll into view */}
      <dl className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-4">
        {[
          { to: 1000, label: "Lassies in the crew" },
          { to: 99, label: "Skulls, under 1%" },
          { to: 16, label: "Traits to explore" },
          { to: 3, label: "Years of Mad", suffix: "+" },
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
        eyebrow="03 / Lore"
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
        eyebrow="04 / Art"
        title="Art"
        text="The 1/1s the team drew for legends and friends, plus previews, sketches and special pieces from the Mad Lads universe."
        action={
          <Button href={links.newsletter} variant="secondary" external>
            See them all on Mad News ↗
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
            <p className="text-[40px] leading-none font-bold tracking-[-0.03em]">Every Lad starts as a sketch.</p>
            <p className="t-body-l text-muted">Previews, studies and special pieces from the artists who shape the Mad Lads universe.</p>
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
const perks = [
  { Icon: CrownIcon, title: "Exclusive content", text: "Holder-only art, lore and behind the scenes." },
  { Icon: TicketIcon, title: "Early access", text: "First in line for drops, events and new releases." },
  { Icon: GiftIcon, title: "Holder perks", text: "Special rewards, collabs and surprises." },
  { Icon: UsersIcon, title: "The inner circle", text: "A tighter crew of Lads building what’s next." },
];

function Holders() {
  return (
    <Section id="holders" tone="sunken">
      <SectionHeader eyebrow="05 / Holders" title="For the holders" text="More than a collection. Log in with Matrica to unlock what’s next." />
      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {perks.map(({ Icon, title, text }, i) => (
          <li key={title} className="reveal flex flex-col gap-3" style={{ "--i": i } as CSSProperties}>
            <Icon className="size-8" />
            <p className="text-xl font-semibold tracking-tight">{title}</p>
            <p className="text-muted">{text}</p>
          </li>
        ))}
      </ul>
      <div className="reveal mt-12 grid items-center gap-5 rounded-lg bg-surface p-6 md:p-8 lg:grid-cols-[300px_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="t-h3">Holder-only</p>
          <p className="text-muted">A preview of what’s behind the wall. Connect through Matrica, no wallet pop-ups.</p>
          <div>
            <Button href={links.matricaLogin}>Login with Matrica</Button>
          </div>
        </div>
        {["/lads/956.jpg", "/lads/638.jpg", "/lads/1742.jpg"].map((src) => (
          <div key={src} className="relative h-[220px] overflow-hidden rounded-[4px]">
            <Image src={src} alt="" fill sizes="25vw" className="scale-125 object-cover blur-2xl" />
            <span className="absolute inset-0 m-auto grid size-12 place-items-center rounded-full bg-white">
              <LockIcon className="size-6" />
            </span>
          </div>
        ))}
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
        text="The latest issues of Mad News: drops, updates and moments from the Mad Lads world."
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
    <section className="flex min-h-[min(88svh,820px)] flex-col justify-center gap-12 px-4 py-28 md:px-page md:py-40">
      <h2 className="t-display-xl reveal-slide">
        Part of the
        <br />
        <span className="text-red">Backpack</span> family.
      </h2>
      <div className="reveal flex max-w-[620px] flex-col items-start gap-7 lg:ml-auto" style={{ "--i": 1 } as CSSProperties}>
        <p className="text-[clamp(1.25rem,2vw,1.625rem)] leading-[1.35] font-medium tracking-[-0.01em] text-muted">
          Mad Lads is the flagship collection of Backpack, the wallet and exchange built for the next generation of onchain culture.
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
    q: "What is Mad Lads?",
    a: "A collection of 10,000 illustrated characters (Lads, Lassies and a few Skulls) on Solana. It launched in April 2023 as the first collection of executable NFTs (xNFTs), made by Coral, the team behind Backpack.",
  },
  {
    q: "What is the link with Backpack?",
    a: "Mad Lads is Backpack’s flagship collection. The same team builds the Backpack wallet and the Backpack exchange, and many holder events and rewards happen there.",
  },
  {
    q: "How can I get a Mad Lad?",
    a: "Mad Lads trade on NFT marketplaces such as Magic Eden and Tensor. Always check you are on the verified Mad Lads collection before buying.",
  },
  {
    q: "How do I trade a Lad peer-to-peer safely?",
    a: (
      <>
        Only use{" "}
        <a href={links.foxySwap} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2 hover:text-accent">
          FoxySwap
        </a>{" "}
        by the Famous Fox Federation: both sides lock their items and the swap only happens when both agree. Never send a Lad directly to someone, and never trust a DM offering a deal. The team will never message you first.
      </>
    ),
  },
  {
    q: "What does “Login with Matrica” do?",
    a: "Matrica checks which Mad Lads you hold through the wallets you have linked to your Matrica account. You unlock holder content without connecting a wallet or signing anything on this site.",
  },
  {
    q: "What are the honoraries and 1/1s?",
    a: "One-of-one pieces the team drew for legends and friends of the community, like Meltem Demirors, Toly and Iggy Azalea. Some special Lads were also made for raffles and collaborations.",
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
          <p className="t-body-l text-muted">New to the Lads, or writing about them? Start here.</p>
        </div>
        <Faq items={faq} />
      </div>
    </Section>
  );
}
