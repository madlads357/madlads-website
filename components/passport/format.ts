// Shared by the passport page and the passport video.
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" }).toUpperCase();

// The identity page fields, in order. `x` marks the handle, shown with the X logo instead of a label.
export function identityFields(d: { name: string; handle?: string; since?: string; lads: number[]; count?: number }) {
  return [
    { key: "name", label: "Name", value: d.name },
    d.handle ? { key: "x", label: "", value: `@${d.handle}` } : null,
    d.since ? { key: "since", label: "MAD since", value: fmtDate(d.since, { month: "long", year: "numeric" }) } : null,
    { key: "lads", label: "LADS held", value: String(d.count ?? d.lads.length) },
  ].filter((f): f is { key: string; label: string; value: string } => f !== null);
}
