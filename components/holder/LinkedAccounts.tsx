"use client";

import { useState } from "react";

// The holder's linked accounts on the profile: Discord (name + passport stamp roles) and, later, X.
// Linking goes through the provider (plain links to /api/accounts/<provider>/start, never prefetched).
// Unlinking deletes the account here and reloads, so the page and the header show the new name.
type Props = {
  discord?: string; // linked Discord name
  roles?: string[]; // its stamp roles on the MAD LADS server
  discordEnabled: boolean; // Discord app configured on the server
};

const chip = "flex items-center gap-1.5 rounded-full py-1.5 text-[14px]";

export function LinkedAccounts({ discord, roles = [], discordEnabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlink = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/accounts/discord", { method: "DELETE" }).catch(() => null);
    if (res?.ok) return location.reload();
    setError("Couldn’t unlink Discord. Please try again.");
    setBusy(false);
  };

  return (
    <section aria-label="Your accounts" className="flex flex-col items-start gap-2">
      <ul className="flex flex-wrap items-center gap-2">
        {discord ? (
          <li className={`${chip} bg-sunken pr-1.5 pl-3`}>
            <span className="font-semibold">Discord</span>
            <span>{discord}</span>
            <span className="text-muted">· {roles.length ? roles.join(", ") : "no stamp roles"}</span>
            <a href="/api/accounts/discord/start?refresh" className="ml-1 rounded-full px-2 py-0.5 font-semibold text-accent hover:bg-line" title="Read your roles on the MAD LADS server again">
              Refresh roles
            </a>
            <button
              type="button"
              onClick={unlink}
              disabled={busy}
              aria-label="Unlink Discord"
              className="grid size-6 place-items-center rounded-full text-muted hover:bg-line hover:text-ink disabled:opacity-50"
            >
              ×
            </button>
          </li>
        ) : (
          discordEnabled && (
            <li>
              <a href="/api/accounts/discord/start" className={`${chip} px-3 font-semibold text-accent ring-1 ring-line hover:ring-ink`}>
                + Link Discord
              </a>
            </li>
          )
        )}
        <li className={`${chip} px-3 text-muted ring-1 ring-line`} title="Coming soon">
          + Link X <span className="text-[12px] tracking-wide uppercase">· soon</span>
        </li>
      </ul>
      {!discord && discordEnabled && <p className="text-[14px] text-muted">Link Discord to get your MAD LADS server roles as stamps on your passport.</p>}
      {error && (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-2 text-[14px] font-medium text-accent">
          {error}
        </p>
      )}
    </section>
  );
}
