"use client";

import { useEffect, useState } from "react";
import { useIsWalletReady, useWallets } from "@solana/kit-plugin-wallet/react";
import { BACKPACK_DOWNLOAD, isPhone, openInBackpackApp, signInWithBackpack, walletClient, WalletError, type Step } from "@/lib/wallet/backpack";

// "Login with Backpack" on /holders, and "Link a vault wallet" in the holder area.
// "I use a Ledger" switches to the Ledger flow: a checklist, then a transaction approved on the device
// and never sent (lib/wallet/backpack.ts). The choice is remembered in this browser.
const LEDGER_KEY = "ml:ledger";

const steps: Record<Step, string> = {
  connect: "Open Backpack to connect…",
  sign: "Sign in Backpack. It’s free: nothing is sent.",
  check: "Checking your LADS…",
};
const ledgerSteps: Record<Step, string> = {
  connect: "Open Backpack to connect your Ledger account…",
  sign: "Approve the transaction in Backpack, then on your Ledger. It’s never sent.",
  check: "Checking your LADS…",
};

const button =
  "inline-flex items-center justify-center gap-2 rounded-[4px] px-6 py-4 text-[15px] leading-none font-semibold whitespace-nowrap transition-colors duration-200 disabled:cursor-wait disabled:opacity-70";

function useLedgerChoice() {
  const [ledger, setLedger] = useState(false);
  useEffect(() => {
    try {
      setLedger(localStorage.getItem(LEDGER_KEY) === "1");
    } catch {}
  }, []);
  const choose = (on: boolean) => {
    setLedger(on);
    try {
      localStorage.setItem(LEDGER_KEY, on ? "1" : "0");
    } catch {}
  };
  return [ledger, choose] as const;
}

// Runs the sign-in and keeps its state. onDone: what to do once the server accepted it.
function useBackpackSignIn(purpose: "login" | "link", onDone: () => void) {
  const [ledger, setLedger] = useLedgerChoice();
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false); // no Backpack in this browser

  const run = async () => {
    setError(null);
    try {
      await signInWithBackpack(purpose, ledger, setStep);
      onDone();
    } catch (e) {
      const err = e instanceof WalletError ? e : new WalletError("Something went wrong. Please try again.");
      if (err.kind === "missing") setNotFound(true);
      else if (err.kind !== "cancelled") setError(err.message);
      setStep(null);
    }
  };
  const chooseLedger = (on: boolean) => {
    setLedger(on);
    setError(null);
  };
  return { run, ledger, chooseLedger, step, busy: step !== null, error, notFound };
}

function LedgerOption({ ledger, onChange, disabled, linking }: { ledger: boolean; onChange: (on: boolean) => void; disabled: boolean; linking?: boolean }) {
  return (
    <div className="flex w-full max-w-[520px] flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-3 text-[15px] font-semibold">
        <input type="checkbox" checked={ledger} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[var(--color-accent)]" />
        I use a Ledger
      </label>
      {ledger && (
        <ol className="list-decimal space-y-1 rounded-xl bg-sunken py-3 pr-4 pl-9 text-[15px] text-muted">
          <li>Plug in your Ledger, unlock it and open the Solana app.</li>
          <li>In Backpack, select your Ledger account{linking ? " (the vault you want to link)" : ""}.</li>
          <li>Approve the transaction in Backpack, then on the Ledger. It’s free and never sent: it only proves the wallet is yours.</li>
          <li>
            It must only contain a short note naming this site, and no transfer. Reject it if it asks for anything else, or if you didn’t just press the button
            here.
          </li>
        </ol>
      )}
    </div>
  );
}

function Status({ step, ledger, error }: { step: Step | null; ledger: boolean; error: string | null }) {
  return (
    <>
      <p aria-live="polite" className="text-[15px] text-muted empty:hidden">
        {step && (ledger ? ledgerSteps : steps)[step]}
      </p>
      {error && (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
          {error}
        </p>
      )}
    </>
  );
}

export function WalletLogin() {
  const { run, ledger, chooseLedger, step, busy, error, notFound } = useBackpackSignIn("login", () => location.assign("/holders")); // full load: page and header read the new session
  const [phone, setPhone] = useState(false);
  const [waited, setWaited] = useState(false); // wallets announce themselves just after load
  const ready = useIsWalletReady(walletClient);
  const found = useWallets(walletClient).length > 0; // the client keeps Backpack only
  const missing = notFound || (ready && waited && !found);

  useEffect(() => {
    setPhone(isPhone());
    const t = setTimeout(() => setWaited(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (missing)
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-muted">{phone ? "Open this page in the Backpack app to log in." : "The holder area logs in with Backpack. Install it, then come back to this page."}</p>
        <div className="flex flex-wrap gap-3">
          {phone && (
            <a href={openInBackpackApp()} className={`${button} bg-accent text-white hover:bg-ink`}>
              Open in Backpack
            </a>
          )}
          <a href={BACKPACK_DOWNLOAD} target="_blank" rel="noopener noreferrer" className={`${button} ${phone ? "border-[1.5px] border-ink hover:bg-ink hover:text-white" : "bg-accent text-white hover:bg-ink"}`}>
            Get Backpack ↗
          </a>
        </div>
      </div>
    );

  return (
    <div className="flex w-full flex-col items-start gap-5">
      <LedgerOption ledger={ledger} onChange={chooseLedger} disabled={busy} />
      <button type="button" onClick={run} disabled={busy} className={`${button} bg-accent text-white hover:bg-ink`}>
        {ledger ? "Login with Ledger" : "Login with Backpack"}
      </button>
      <Status step={step} ledger={ledger} error={error} />
    </div>
  );
}

/* ------------------------------------------------------------ Vault links (holder area) */

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

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
          {short(wallet)} <span className="font-sans text-muted">· logged in</span>
        </li>
        {vaults.map((v) => (
          <li key={v} className="flex items-center gap-1 rounded-full bg-sunken py-1.5 pr-1.5 pl-3 font-mono" title={v}>
            {short(v)} <span className="font-sans text-muted">· vault</span>
            <button
              type="button"
              onClick={() => remove({ vault: v })}
              disabled={removing !== null}
              aria-label={`Remove vault ${short(v)}`}
              className="ml-1 grid size-6 place-items-center rounded-full font-sans text-muted hover:bg-line hover:text-ink disabled:opacity-50"
            >
              ×
            </button>
          </li>
        ))}
        {hots.map((h) => (
          <li key={h} className="flex items-center gap-1 rounded-full bg-sunken py-1.5 pr-1.5 pl-3 font-mono" title={h}>
            {short(h)} <span className="font-sans text-muted">· can log in for you</span>
            <button
              type="button"
              onClick={() => remove({ hot: h })}
              disabled={removing !== null}
              aria-label={`Stop ${short(h)} from logging in for this wallet`}
              className="ml-1 grid size-6 place-items-center rounded-full font-sans text-muted hover:bg-line hover:text-ink disabled:opacity-50"
            >
              ×
            </button>
          </li>
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
            <li>Switch back if you like: from now on, logging in with {short(wallet)} counts its LADS too.</li>
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
