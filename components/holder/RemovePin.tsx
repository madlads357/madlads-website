"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// "Remove my pin", for a holder who no longer has a LAD and so can't open the map (app/holders/map/page.tsx).
export function RemovePin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/holder/map", { method: "DELETE" });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn’t remove your pin.");
      router.replace("/holders");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-[4px] bg-accent px-6 py-4 text-[15px] leading-none font-semibold text-white transition-colors hover:bg-ink disabled:opacity-50"
      >
        {busy ? "Removing…" : "Remove my pin"}
      </button>
      {error && (
        <p role="alert" className="rounded-lg bg-red/10 px-4 py-3 font-medium text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
