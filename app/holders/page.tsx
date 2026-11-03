import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { LockIcon } from "@/components/Icons";
import { authMode } from "@/lib/auth/config";
import { getSession, type HolderSession } from "@/lib/auth/session";
import { perks } from "@/data/holders";
import { HolderLads } from "@/components/HolderLads";

// The holder area. Reads the login cookie, so it is rendered on every request (not prebuilt).
export const metadata: Metadata = {
  title: "Holders",
  description: "The Mad Lads holder area. Log in with Matrica.",
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
        <p className="t-body-l text-muted">The holder area opens with Login with Matrica. Follow Mad News and X to know when it goes live.</p>
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
          Log in with Matrica to see your Lads and unlock the holder area. No wallet pop-up and nothing to sign: Matrica only tells us which Mad Lads you hold.
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

function NoLads({ session }: { session: HolderSession }) {
  return (
    <Shell title="No Lad found.">
      <p className="t-body-l text-muted">
        Hey {session.name}, we couldn’t find a Mad Lad in the wallets linked to your Matrica account. If your Lad is in another wallet, link it on Matrica, then
        log in again.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button href="https://matrica.io" external>
          Link a wallet on Matrica ↗
        </Button>
        <Button href={LOGIN} variant="secondary">
          Log in again
        </Button>
        <Logout />
      </div>
    </Shell>
  );
}

function Holder({ session }: { session: HolderSession }) {
  const n = session.lads.length;
  return (
    <>
      <header className="flex flex-col gap-8 px-4 pt-16 pb-12 md:flex-row md:items-end md:justify-between md:px-page md:pt-24 md:pb-16">
        <div className="flex flex-col gap-6">
          <p className="t-eyebrow text-accent">Holders</p>
          <div className="flex items-center gap-5">
            {session.avatar && (
              // Matrica profile picture: plain <img>, its host isn't known in advance
              <img src={session.avatar} alt="" className="size-16 rounded-full object-cover ring-1 ring-line md:size-20" />
            )}
            <h1 className="t-display-l">Welcome back, {session.name}.</h1>
          </div>
          <p className="t-body-l text-muted">
            You hold <span className="font-semibold text-ink">{n}</span> Mad {n === 1 ? "Lad" : "Lads"}. Fock it.
          </p>
        </div>
        <Logout />
      </header>

      <section className="px-4 pb-20 md:px-page" aria-label="Your Mad Lads">
        <HolderLads ids={session.lads} />
      </section>

      {/* TODO: the Culture Hub and the holder perks move in here. */}
      <section className="bg-sunken px-4 py-20 md:px-page md:py-section">
        <p className="t-eyebrow text-accent">Coming to the holder area</p>
        <h2 className="t-h2 mt-4">More is on the way.</h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map(({ Icon, title, text }) => (
            <li key={title} className="flex flex-col gap-3 rounded-lg bg-surface p-6">
              <Icon className="size-8" />
              <p className="text-xl font-semibold tracking-tight">{title}</p>
              <p className="text-muted">{text}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-semibold text-muted">
                <LockIcon className="size-4" /> Soon
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ------------------------------------------------------------ Pieces */

function Perks() {
  return (
    <section className="bg-sunken px-4 py-20 md:px-page md:py-section" aria-label="What holders get">
      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
