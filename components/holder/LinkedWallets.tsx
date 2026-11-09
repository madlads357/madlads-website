"use client";

import { useState } from "react";
import { shortAddress } from "@/lib/auth/hint";
import { button, LedgerOption, Status, useBackpackSignIn } from "@/components/wallet-signin";

// The wallets the holder area reads LADS from: the one logged in, plus vaults linked to it.
// Linking: switch to the vault in Backpack, then sign once with it (Ledger or not).
// hots: logged in with a vault wallet, the wallets that can log in for it (it can remove them).
export function LinkedWallets({ wallet, vaults, hots = [], defaultOpen = false }: { wallet: string; vaults: string[]; hots?: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { run, ledger, chooseLedger, step, busy, error } = useBackpackSignIn("link", () => location.reload()); // page and header pick up the new LADS
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const remove = async (who: { vault: string } | { hot: string }) => {
    setRemoving(Object.values(who)[0]);
    setRemoveError(null);
    const res = await fetch("/api/holder/wallets", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(who) }).catch(() => null);
    if (res?.ok) return location.reload();
    setRemoveError("Couldn’t remove that wallet. Please try again.");
    setRemoving(null);
  };

  return (
    <section aria-label="Your wallets" className="flex flex-col items-start gap-3">
      <ul className="flex flex-wrap items-center gap-2 text-[14px]">
        <li className="rounded-full bg-sunken px-3 py-1.5 font-mono" title={wallet}>
          {shortAddress(wallet)} <span className="font-sans text-muted">· logged in</span>
        </li>
        {vaults.map((v) => (
          <WalletChip key={v} address={v} tag="vault" removeLabel={`Remove vault ${shortAddress(v)}`} disabled={removing !== null} onRemove={() => remove({ vault: v })} />
        ))}
        {hots.map((h) => (
          <WalletChip
            key={h}
            address={h}
            tag="can log in for you"
            removeLabel={`Stop ${shortAddress(h)} from logging in for this wallet`}
            disabled={removing !== null}
            onRemove={() => remove({ hot: h })}
          />
        ))}
        {!open && (
          <li>
            <button type="button" onClick={() => setOpen(true)} className="rounded-full px-3 py-1.5 font-semibold text-accent ring-1 ring-line hover:ring-ink">
              + Link a vault wallet
            </button>
          </li>
        )}
      </ul>

      {open && (
        <div className="flex w-full max-w-[520px] flex-col items-start gap-4 rounded-2xl bg-surface p-5 ring-1 ring-line">
          <p className="font-semibold">LADS in a cold wallet or on a Ledger?</p>
          <ol className="list-decimal space-y-1 pl-5 text-[15px] text-muted">
            <li>In Backpack, switch to the wallet that holds them.</li>
            <li>Press “Sign with that wallet”. It’s a one-time, free signature.</li>
            <li>Switch back if you like: from now on, logging in with {shortAddress(wallet)} counts its LADS too.</li>
          </ol>
          <LedgerOption ledger={ledger} onChange={chooseLedger} disabled={busy} linking />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={run} disabled={busy} className={`${button} bg-accent text-white hover:bg-ink`}>
              {ledger ? "Sign with the Ledger" : "Sign with that wallet"}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={busy} className={`${button} border-[1.5px] border-line text-muted hover:border-ink hover:text-ink`}>
              Cancel
            </button>
          </div>
          <Status step={step} ledger={ledger} error={error} />
        </div>
      )}
      {removeError && (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
          {removeError}
        </p>
      )}
    </section>
  );
}

// A linked wallet: its short address, what it is for this wallet, and a × to remove the link.
function WalletChip({ address, tag, removeLabel, disabled, onRemove }: { address: string; tag: string; removeLabel: string; disabled: boolean; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-1 rounded-full bg-sunken py-1.5 pr-1.5 pl-3 font-mono" title={address}>
      {shortAddress(address)} <span className="font-sans text-muted">· {tag}</span>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={removeLabel}
        className="ml-1 grid size-6 place-items-center rounded-full font-sans text-muted hover:bg-line hover:text-ink disabled:opacity-50"
      >
        ×
      </button>
    </li>
  );
}
