// Packs a list of Mad Lad numbers into a short string for the session cookie (server-only).
// Lad numbers go up to 9971, so 14 bits each (instead of ~5 characters as JSON text): 500 Lads take
// about 1.2 KB instead of 3 KB, which keeps the whole sealed cookie well under the browsers' 4 KB limit.
const BITS = 14; // 2^14 = 16384 > 9971

export function packLads(ids: number[]): string {
  const valid = ids.filter((n) => Number.isInteger(n) && n >= 0 && n < 1 << BITS);
  const bytes = new Uint8Array(Math.ceil((valid.length * BITS) / 8));
  let bit = 0;
  for (const n of valid) {
    for (let i = BITS - 1; i >= 0; i--, bit++) if ((n >> i) & 1) bytes[bit >> 3] |= 0x80 >> (bit & 7);
  }
  return `${valid.length}.${Buffer.from(bytes).toString("base64url")}`; // the count tells padding bits from data
}

export function unpackLads(packed: string): number[] {
  const [count, data = ""] = packed.split(".");
  const n = Number(count);
  const bytes = Buffer.from(data, "base64url");
  if (!Number.isInteger(n) || n < 0 || bytes.length * 8 < n * BITS) return [];
  const out: number[] = [];
  let bit = 0;
  for (let k = 0; k < n; k++) {
    let v = 0;
    for (let i = 0; i < BITS; i++, bit++) v = (v << 1) | ((bytes[bit >> 3] >> (7 - (bit & 7))) & 1);
    out.push(v);
  }
  return out;
}
