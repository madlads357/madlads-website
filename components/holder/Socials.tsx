"use client";

import { useEffect, useRef, useState } from "react";
import "./socials.css";

// Socials on the holder profile: Discord and X as chips, in the same style as the wallet chips.
// Not linked: outlined chip "Link Discord" whose logo wiggles now and then (socials.css) until hovered.
// Linked: filled chip with the logo in Discord Blurple, the name and stamp roles, and a ⋯ menu.
// Linking goes through the provider: plain links to /api/accounts/<provider>/start (never prefetched).
// X isn't available yet: shown greyed out with "soon".
// Logos: the official marks, unaltered (Discord: Blurple #5865F2 or black/white; X: black/white).
type Props = {
  discord?: string; // linked Discord name
  roles?: string[]; // its stamp roles on the MAD LADS server
  discordEnabled: boolean; // Discord app configured on the server
};

const DiscordLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const XLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const chip = "flex h-8 items-center gap-2 rounded-full px-3 text-[14px] leading-none";

export function Socials({ discord, roles = [], discordEnabled }: Props) {
  if (!discord && !discordEnabled) return null;
  return (
    <ul aria-label="Your socials" className="flex flex-wrap items-center gap-2">
      <li>{discord ? <DiscordLinked name={discord} roles={roles} /> : <DiscordLink />}</li>
      <li>
        <span className={`${chip} text-muted ring-1 ring-line`} title="Linking X is coming soon">
          <XLogo className="size-3.5" />
          Link X <span className="text-[12px]">· soon</span>
        </span>
      </li>
    </ul>
  );
}

// Not linked: the logo wiggles until the visitor has noticed the chip (hover or keyboard focus).
function DiscordLink() {
  const [seen, setSeen] = useState(false);
  return (
    <a
      href="/api/accounts/discord/start"
      data-seen={seen || undefined}
      onPointerEnter={() => setSeen(true)}
      onFocus={() => setSeen(true)}
      title="Your roles on the MAD LADS Discord become stamps on your passport"
      className={`${chip} font-semibold ring-1 ring-line transition-colors hover:bg-[#5865F2] hover:text-white hover:ring-[#5865F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <span className="social-nudge">
        <DiscordLogo className="size-4" />
      </span>
      Link Discord
    </a>
  );
}

// Linked: the name and stamp roles, with a ⋯ menu (Refresh roles, Unlink).
function DiscordLinked({ name, roles }: { name: string; roles: string[] }) {
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  const unlink = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/accounts/discord", { method: "DELETE" }).catch(() => null);
    if (res?.ok) return location.reload(); // the page and the header show the name without Discord
    setError("Couldn’t unlink Discord. Please try again.");
    setBusy(false);
  };

  return (
    <div ref={box} className="relative">
      <span className={`${chip} bg-sunken pr-1`}>
        <DiscordLogo className="size-4 text-[#5865F2]" />
        <span className="font-semibold">{name}</span>
        <span className="text-muted">· {roles.length ? roles.join(", ") : "no stamp roles"}</span>
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-label="Discord options"
          className="grid size-6 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"
        >
          ⋯
        </button>
      </span>
      {menu && (
        <div role="menu" className="absolute top-full left-0 z-10 mt-2 w-48 animate-[pop_160ms_ease-out] rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          <a href="/api/accounts/discord/start?refresh" role="menuitem" className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-sunken">
            Refresh roles
          </a>
          <button type="button" role="menuitem" onClick={unlink} disabled={busy} className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-muted hover:bg-sunken hover:text-ink disabled:opacity-50">
            Unlink Discord
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="absolute top-full left-0 mt-2 rounded-lg bg-red/10 px-3 py-2 text-[14px] font-medium whitespace-nowrap text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
