"use client";

import { useEffect, useState } from "react";
import { useIsWalletReady, useWallets } from "@solana/kit-plugin-wallet/react";
import { BACKPACK_DOWNLOAD, isPhone, openInBackpackApp, walletClient } from "@/lib/wallet/backpack";
import { button, LedgerOption, Status, useBackpackSignIn } from "./wallet-signin";

// "Login with Backpack" on /holders (logged out). Needs the wallet library up front: it detects Backpack
// as the page loads. The sign-in itself, the Ledger option and the vault panel are in wallet-signin.tsx
// and holder/LinkedWallets.tsx.
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
