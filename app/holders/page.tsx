import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { authMode } from "@/lib/auth/config";
import { getSession, type HolderSession } from "@/lib/auth/session";
import { perks } from "@/data/holders";
import { HolderProfile } from "@/components/holder/HolderProfile";

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

function NoLads({ session }: { session: HolderSession }) {
  return (
    <Shell title="No LAD found.">
      <p className="t-body-l text-muted">
        Hey {session.name}, we couldn’t find a MAD LADS in the wallets linked to your Matrica account. If your LAD is in another wallet, link it on Matrica, then
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
