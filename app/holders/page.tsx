import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { authMode, mockLogin, type AuthMode } from "@/lib/auth/config";
import { getSession, type HolderSession } from "@/lib/auth/session";
import { HolderProfile } from "@/components/holder/HolderProfile";
import Image from "next/image";
import Link from "next/link";
import { thumbImage } from "@/lib/madlads";
import { links } from "@/data/site";
import { discordEnabled } from "@/lib/accounts/discord";
import { db } from "@/lib/db";
import { LinkedWallets, WalletLogin } from "@/components/WalletLogin";

const MAX_LAD = 9971; // numbers in the collection (#1 to #9971)
const PICKS = 14; // LADS shown on "Pick your LAD" (fewer on small screens, see NoLads)
const TILT = [-6, 4, -3, 5, -4, 3, -5, 2, 6, -2, 4, -6, 3, -4]; // degrees, one per pick

// The holder area. Reads the login cookie, so it is rendered on every request (not prebuilt).
export const metadata: Metadata = {
  title: "Holders",
  description: "The MAD LADS holder area. Log in with Backpack.",
  robots: { index: false }, // personal page: keep it out of search results
};

const LOGIN = "/api/auth/login";

const errors: Record<string, string> = {
  cancelled: "Login cancelled on Matrica. Try again whenever you’re ready.",
  expired: "That login took too long or was started in another tab. Please try again.",
  matrica: "We couldn’t reach Matrica. Please try again in a moment.",
};

// After linking an account (?linked=discord, ?link=…).
const linkNotices: Record<string, { text: string; ok: boolean }> = {
  discord: { text: "Discord linked. Your server roles are on your passport.", ok: true },
  cancelled: { text: "Linking cancelled. Try again whenever you’re ready.", ok: false },
  expired: { text: "That took too long or was started in another tab. Please try again.", ok: false },
  error: { text: "We couldn’t reach Discord. Please try again in a moment.", ok: false },
  off: { text: "Linking accounts isn’t available yet.", ok: false },
};

export default async function HoldersPage({ searchParams }: { searchParams: Promise<{ error?: string; linked?: string; link?: string }> }) {
  const mode = authMode();
  const session = mode === "off" ? null : await getSession();
  const params = await searchParams;
  const error = errors[params.error ?? ""];
  const notice = linkNotices[params.linked ?? params.link ?? ""];

  return (
    <>
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        {mode === "off" ? (
          <ComingSoon />
        ) : !session ? (
          <LoggedOut mode={mode} error={error} />
        ) : session.lads.length === 0 ? (
          <NoLads session={session} />
        ) : (
          <Holder session={session} notice={notice} />
        )}
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
        <p className="t-body-l text-muted">The holder area opens soon. Follow MAD News and X to know when it goes live.</p>
        <Button href="/" variant="secondary">
          Back home
        </Button>
      </Shell>
    </>
  );
}

function LoggedOut({ mode, error }: { mode: AuthMode; error?: string }) {
  return (
    <>
      <Shell title="For the holders.">
        {mode === "matrica" ? (
          <p className="t-body-l text-muted">
            Log in with Matrica to see your LADS and unlock the holder area. No wallet pop-up and nothing to sign: Matrica only tells us which MAD LADS you hold.
          </p>
        ) : (
          <p className="t-body-l text-muted">
            Log in with your Backpack wallet to see your LADS and unlock the holder area. You sign a message to prove the wallet is yours: it’s free, and nothing is sent or
            spent.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
            {error}
          </p>
        )}
        {mode === "matrica" ? <Button href={LOGIN}>Login with Matrica</Button> : mode === "wallet" && <WalletLogin />}
        {mockLogin() && (
          <p className="text-[14px] text-muted">
            Dev test logins: <a className="underline" href={`${LOGIN}?as=holder`}>holder</a> · <a className="underline" href={`${LOGIN}?as=whale`}>whale</a> ·{" "}
            <a className="underline" href={`${LOGIN}?as=none`}>no LAD</a>
          </p>
        )}
      </Shell>
    </>
  );
}

// Logged in, but no LAD in the wallet(s): two ways forward, not a dead end. Already have one in
// another wallet → link it as a vault (wallet login), or on Matrica and log in again. Not yet → where to get one, a few LADS to look at,
// and what holders get.
function NoLads({ session }: { session: HolderSession }) {
  // New ones on every visit, no repeats. Two rows: 10 on phones, 12 on tablets, 14 on wide screens.
  const picks = new Set<number>();
  while (picks.size < PICKS) picks.add(1 + Math.floor(Math.random() * MAX_LAD));
  return (
    <>
      <Shell title="No LAD found.">
        <p className="t-body-l text-muted">
          {session.wallet ? `There’s no MAD LADS in ${session.name}${session.vaults?.length ? " or its linked wallets" : ""}.` : `Hey ${session.name}, there’s no MAD LADS in the wallets linked to your Matrica account.`}
        </p>
      </Shell>
      <div className="grid gap-4 px-4 pb-16 md:grid-cols-2 md:gap-6 md:px-page md:pb-24">
        <section className="flex flex-col items-start gap-4 rounded-2xl bg-surface p-6 ring-1 ring-line md:p-8">
          <p className="t-eyebrow text-accent">Already have one?</p>
          <h2 className="t-h3">It’s in another wallet.</h2>
          {session.wallet ? (
            <>
              <p className="text-muted">Link it once and your LADS show up here, without logging in with it every time. Handy for a Ledger.</p>
              <div className="mt-auto pt-2">
                <LinkedWallets wallet={session.wallet} vaults={session.vaults ?? []} defaultOpen />
              </div>
            </>
          ) : (
            <>
              <p className="text-muted">Link that wallet on Matrica, then log in again. Your LADS show up right away.</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-2">
                <Button href="https://matrica.io" external>
                  Link a wallet on Matrica ↗
                </Button>
                <Button href={`${LOGIN}?again`} variant="secondary">
                  Log in again
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="flex flex-col items-start gap-4 rounded-2xl bg-surface p-6 ring-1 ring-line md:p-8">
          <p className="t-eyebrow text-accent">Not yet?</p>
          <h2 className="t-h3">Pick your LAD.</h2>
          <p className="text-muted">MAD LADS trade on Magic Eden and Tensor. Find one you like first: every LAD has its own page.</p>
          <ul className="grid w-full grid-cols-5 gap-y-2 pt-1 pr-3 sm:grid-cols-6 xl:grid-cols-7" aria-label="A few MAD LADS">
            {[...picks].map((id, i) => (
              <li
                key={id}
                className="relative -mr-3 transition hover:z-10 hover:-translate-y-1 max-sm:nth-[n+11]:hidden sm:max-xl:nth-[n+13]:hidden"
                style={{ rotate: `${TILT[i % TILT.length]}deg` }}
              >
                <Link href={`/madlads/${id}`} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-sunken ring-4 ring-surface">
                  <Image src={thumbImage(id)} alt={`MAD LADS #${id}`} fill sizes="96px" quality={70} className="object-cover" />
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
      <div className="flex justify-center px-4 py-10">
        <Logout />
      </div>
    </>
  );
}

// The profile: welcome, the holder's Lads, and the backpack the objects fall out of.
function Holder({ session, notice }: { session: HolderSession; notice?: { text: string; ok: boolean } }) {
  return (
    <HolderProfile
      name={session.name}
      handle={session.handle}
      since={session.since}
      roles={session.roles}
      lads={session.lads}
      photo={session.photo}
      wallet={session.wallet}
      vaults={session.vaults}
      discord={session.discord}
      discordEnabled={discordEnabled() && !!db && authMode() !== "matrica"}
      notice={notice}
    />
  );
}

/* ------------------------------------------------------------ Pieces */

function Logout() {
  return (
    <form action="/api/auth/logout" method="post">
      <button type="submit" className="rounded-[4px] border-[1.5px] border-line px-6 py-4 text-[15px] leading-none font-semibold text-muted transition-colors hover:border-ink hover:text-ink">
        Log out
      </button>
    </form>
  );
}
