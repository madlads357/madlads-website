import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { authMode } from "@/lib/auth/config";
import { getSession, type HolderSession } from "@/lib/auth/session";
import { perks } from "@/data/holders";
import { HolderProfile } from "@/components/holder/HolderProfile";
import Image from "next/image";
import Link from "next/link";
import { thumbImage } from "@/lib/madlads";
import { links } from "@/data/site";

const MAX_LAD = 9971; // numbers in the collection (#1 to #9971)

// The holder area. Reads the login cookie, so it is rendered on every request (not prebuilt).
export const metadata: Metadata = {
  title: "Holders",
  description: "The MAD LADS holder area. Log in with Matrica.",
  robots: { index: false }, // personal page: keep it out of search results
};

const LOGIN = "/api/auth/login";

const errors: Record<string, string> = {
  cancelled: "Login cancelled on Matrica. Try again whenever you’re ready.",
  expired: "That login took too long or was started in another tab. Please try again.",
  matrica: "We couldn’t reach Matrica. Please try again in a moment.",
};

export default async function HoldersPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const mode = authMode();
  const session = mode === "off" ? null : await getSession();
  const error = errors[(await searchParams).error ?? ""];

  return (
    <>
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        {mode === "off" ? <ComingSoon /> : !session ? <LoggedOut error={error} /> : session.lads.length === 0 ? <NoLads session={session} /> : <Holder session={session} />}
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------ States */

function Shell({ eyebrow = "Holders", title, children }: { eyebrow?: string; title: ReactNode; children: ReactNode }) {
  return (
    <header className="px-4 pt-16 pb-12 md:px-page md:pt-24 md:pb-16">
      <p className="t-eyebrow text-accent">{eyebrow}</p>
      <h1 className="t-display-l mt-8">{title}</h1>
      <div className="mt-8 flex max-w-[640px] flex-col items-start gap-8">{children}</div>
    </header>
  );
}

function ComingSoon() {
  return (
    <>
      <Shell title="Opening soon.">
        <p className="t-body-l text-muted">The holder area opens with Login with Matrica. Follow MAD News and X to know when it goes live.</p>
        <Button href="/" variant="secondary">
          Back home
        </Button>
      </Shell>
      <Perks />
    </>
  );
}

function LoggedOut({ error }: { error?: string }) {
  return (
    <>
      <Shell title="For the holders.">
        <p className="t-body-l text-muted">
          Log in with Matrica to see your LADS and unlock the holder area. No wallet pop-up and nothing to sign: Matrica only tells us which MAD LADS you hold.
        </p>
        {error && (
          <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
            {error}
          </p>
        )}
        <Button href={LOGIN}>Login with Matrica</Button>
      </Shell>
      <Perks />
    </>
  );
}

// Logged in, but no LAD in the linked wallets: two ways forward, not a dead end. Already have one in
// another wallet → link it on Matrica and log in again. Not yet → where to get one, a few LADS to look at,
// and what holders get.
function NoLads({ session }: { session: HolderSession }) {
  const picks = Array.from({ length: 6 }, () => 1 + Math.floor(Math.random() * MAX_LAD)); // new ones on every visit
  return (
    <>
      <Shell title="No LAD found.">
        <p className="t-body-l text-muted">Hey {session.name}, there’s no MAD LADS in the wallets linked to your Matrica account.</p>
      </Shell>
      <div className="grid gap-4 px-4 pb-16 md:grid-cols-2 md:gap-6 md:px-page md:pb-24">
        <section className="flex flex-col items-start gap-4 rounded-2xl bg-surface p-6 ring-1 ring-line md:p-8">
          <p className="t-eyebrow text-accent">Already have one?</p>
          <h2 className="t-h3">It’s in another wallet.</h2>
          <p className="text-muted">Link that wallet on Matrica, then log in again. Your LADS show up right away.</p>
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <Button href="https://matrica.io" external>
              Link a wallet on Matrica ↗
            </Button>
            <Button href={`${LOGIN}?again`} variant="secondary">
              Log in again
            </Button>
          </div>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl bg-surface p-6 ring-1 ring-line md:p-8">
          <p className="t-eyebrow text-accent">Not yet?</p>
          <h2 className="t-h3">Pick your LAD.</h2>
          <p className="text-muted">MAD LADS trade on Magic Eden and Tensor. Find one you like first: every LAD has its own page.</p>
          <ul className="flex -space-x-3 pt-1" aria-label="A few MAD LADS">
            {picks.map((id, i) => (
              <li key={`${id}-${i}`} style={{ rotate: `${[-6, 4, -3, 5, -4, 3][i]}deg` }}>
                <Link href={`/madlads/${id}`} className="relative block size-16 overflow-hidden rounded-xl bg-sunken ring-4 ring-surface transition hover:z-10 hover:-translate-y-1 md:size-20">
                  <Image src={thumbImage(id)} alt={`MAD LADS #${id}`} fill sizes="80px" quality={70} className="object-cover" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <Button href={links.magicEden} external>
              Magic Eden ↗
            </Button>
            <Button href={links.tensor} variant="secondary" external>
              Tensor ↗
            </Button>
            <Button href="/madlads" variant="secondary">
              Browse all LADS
            </Button>
          </div>
        </section>
      </div>
      <Perks />
      <div className="flex justify-center px-4 py-10">
        <Logout />
      </div>
    </>
  );
}

// The profile: welcome, the holder's Lads, and the backpack the objects fall out of.
function Holder({ session }: { session: HolderSession }) {
  return (
    <HolderProfile
      name={session.name}
      handle={session.handle}
      since={session.since}
      roles={session.roles}
      lads={session.lads}
      photo={session.photo}
    />
  );
}

/* ------------------------------------------------------------ Pieces */

function Perks() {
  return (
    <section className="bg-sunken px-4 py-20 md:px-page md:py-section" aria-label="What holders get">
      <ul className="grid gap-10 md:grid-cols-3">
        {perks.map(({ Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-3">
            <Icon className="size-8" />
            <p className="text-xl font-semibold tracking-tight">{title}</p>
            <p className="text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Logout() {
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" className="rounded-[4px] border-[1.5px] border-line px-6 py-4 text-[15px] leading-none font-semibold text-muted transition-colors hover:border-ink hover:text-ink">
        Log out
      </button>
    </form>
  );
}
