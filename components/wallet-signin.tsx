"use client";

import { useEffect, useState } from "react";
import type { Step } from "@/lib/wallet/backpack"; // a type only: the wallet library itself loads when someone signs

// What "Login with Backpack" (WalletLogin) and "Link a vault wallet" (holder/LinkedWallets) share:
// running the sign-in, the "I use a Ledger" choice, and the progress and error lines.
// The wallet library (lib/wallet/backpack.ts: Solana Kit, about 45 KB gzipped) is imported when the button is
// pressed, so a profile page that only shows the linked wallets doesn't download it.
// "I use a Ledger" switches to the Ledger flow: a checklist, then a transaction approved on the device and
// never sent. The choice is remembered in this browser.
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

export const button =
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
export function useBackpackSignIn(purpose: "login" | "link", onDone: () => void) {
  const [ledger, setLedger] = useLedgerChoice();
  const [step, setStep] = useState<Step | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false); // no Backpack in this browser

  const run = async () => {
    setError(null);
    try {
      const { signInWithBackpack } = await import("@/lib/wallet/backpack");
      await signInWithBackpack(purpose, ledger, setStep);
      onDone();
    } catch (e) {
      // A WalletError says what went wrong (its `kind`); anything else is unexpected.
      const kind = (e as { kind?: string }).kind;
      if (kind === "missing") setNotFound(true);
      else if (kind !== "cancelled") setError(kind && e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setStep(null);
    }
  };
  const chooseLedger = (on: boolean) => {
    setLedger(on);
    setError(null);
  };
  return { run, ledger, chooseLedger, step, busy: step !== null, error, notFound };
}

export function LedgerOption({ ledger, onChange, disabled, linking }: { ledger: boolean; onChange: (on: boolean) => void; disabled: boolean; linking?: boolean }) {
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

export function Status({ step, ledger, error }: { step: Step | null; ledger: boolean; error: string | null }) {
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
