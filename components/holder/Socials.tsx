"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DiscordIcon, XIcon } from "@/components/Icons";
import { useDismiss } from "@/lib/useDismiss";
import "./socials.css";

// Socials on the holder profile: Discord and X as chips, in the same style as the wallet chips.
// Not linked: outlined "Link …" chip whose logo wiggles now and then (socials.css) until hovered.
// Linked: filled chip with the name (Discord: and its stamp roles), and a ⋯ menu.
// Linking goes through the provider: plain links to /api/accounts/<provider>/start (never prefetched).
// Logos: the official marks, unaltered (Discord: Blurple #5865F2 or black/white; X: black/white).
type Props = {
  discord?: string; // linked Discord name
  roles?: string[]; // its stamp roles on the MAD LADS server
  discordEnabled: boolean; // Discord app configured on the server
  handle?: string; // linked X handle (without @)
  xEnabled: boolean; // X app configured on the server
};

const chip = "flex h-8 items-center gap-2 rounded-full px-3 text-[14px] leading-none";

export function Socials({ discord, roles = [], discordEnabled, handle, xEnabled }: Props) {
  const showDiscord = !!discord || discordEnabled;
  const showX = !!handle || xEnabled;
  if (!showDiscord && !showX) return null;
  return (
    <ul aria-label="Your socials" className="flex flex-wrap items-center gap-2">
      {showDiscord && (
        <li>
          {discord ? (
            <Linked provider="discord" label="Discord" logo={<DiscordIcon className="size-4 text-[#5865F2]" />} items={[{ href: "/api/accounts/discord/start?refresh", text: "Refresh roles" }]}>
              <span className="font-semibold">{discord}</span>
              <span className="text-muted">· {roles.length ? roles.join(", ") : "no stamp roles"}</span>
            </Linked>
          ) : (
            <LinkChip href="/api/accounts/discord/start" brand="#5865F2" title="Your roles on the MAD LADS Discord become stamps on your passport" logo={<DiscordIcon className="size-4" />}>
              Link Discord
            </LinkChip>
          )}
        </li>
      )}
      {showX && (
        <li>
          {handle ? (
            <Linked provider="x" label="X" logo={<XIcon className="size-3.5" />} items={[{ href: "/api/accounts/x/start", text: "Switch X account" }]}>
              <span className="font-semibold">@{handle}</span>
            </Linked>
          ) : (
            <LinkChip href="/api/accounts/x/start" brand="#000000" title="Your X handle goes on your passport" logo={<XIcon className="size-3.5" />} later>
              Link X
            </LinkChip>
          )}
        </li>
      )}
    </ul>
  );
}

// Not linked: the logo wiggles until the visitor has noticed the chip (hover or keyboard focus).
// later: wiggle a moment after the first chip, not at the same time.
function LinkChip({ href, brand, title, logo, later, children }: { href: string; brand: string; title: string; logo: ReactNode; later?: boolean; children: ReactNode }) {
  const [seen, setSeen] = useState(false);
  return (
    <a
      href={href}
      data-seen={seen || undefined}
      onPointerEnter={() => setSeen(true)}
      onFocus={() => setSeen(true)}
      title={title}
      style={{ "--brand": brand } as CSSProperties}
      className={`${chip} font-semibold ring-1 ring-line transition-colors hover:bg-[var(--brand)] hover:text-white hover:ring-[var(--brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
    >
      <span className="social-nudge" style={later ? { animationDelay: "5s" } : undefined}>
        {logo}
      </span>
      {children}
    </a>
  );
}

// Linked: the account, with a ⋯ menu (the provider's own items, then Unlink).
function Linked({ provider, label, logo, items, children }: { provider: "discord" | "x"; label: string; logo: ReactNode; items: { href: string; text: string }[]; children: ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useDismiss(menu, box, setMenu);

  const unlink = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/accounts/${provider}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) return location.reload(); // the page and the header show the new name
    setError(`Couldn’t unlink ${label}. Please try again.`);
    setBusy(false);
  };

  return (
    <div ref={box} className="relative">
      <span className={`${chip} bg-sunken pr-1`}>
        {logo}
        {children}
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-haspopup="menu"
          aria-label={`${label} options`}
          className="grid size-6 place-items-center rounded-full text-muted hover:bg-line hover:text-ink"
        >
          ⋯
        </button>
      </span>
      {menu && (
        <div role="menu" className="absolute top-full left-0 z-10 mt-2 w-48 animate-[pop_160ms_ease-out] rounded-xl border border-line bg-surface p-1.5 shadow-xl">
          {items.map((i) => (
            <a key={i.href} href={i.href} role="menuitem" className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-sunken">
              {i.text}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={unlink} disabled={busy} className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-muted hover:bg-sunken hover:text-ink disabled:opacity-50">
            Unlink {label}
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
