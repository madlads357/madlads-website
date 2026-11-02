// Full Mad Lads collection: loading, decoding and image URLs.
// Data: /public/data/madlads.json, generated from the official madlads.com gallery metadata
// (+ the S3 metadata of the later 1/1s #9968–9971). Format:
//   traits: [{ name, values[] }]         — trait order is fixed
//   lads:   [[id, valueIndex per trait]]  — -1 when the Lad doesn't have that trait

export type Trait = { name: string; values: string[] };
export type Collection = { traits: Trait[]; lads: number[][] };

let cache: Promise<Collection> | null = null;

export function loadCollection(): Promise<Collection> {
  cache ??= fetch("/data/madlads.json").then((r) => {
    if (!r.ok) throw new Error(`Could not load Mad Lads data (${r.status})`);
    return r.json() as Promise<Collection>;
  });
  return cache;
}

const S3 = "https://madlads.s3.us-west-2.amazonaws.com/images";

/** Full-resolution original (2048×2560 PNG, ~5 MB). */
export const originalImage = (id: number) => `${S3}/${id}.png`;

/** 400×500 thumbnail via Tensor's image CDN (~100 KB). */
export const thumbImage = (id: number) =>
  `https://prod-image-cdn.tensor.trade/images/slug=bd366797-5599-417a-be03-1e43a7e3fb90/400x400/freeze=false/${encodeURIComponent(
    originalImage(id),
  )}`;
