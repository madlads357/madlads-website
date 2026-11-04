import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

// Open Graph link preview for this page, generated at build time (see lib/og.tsx).
export const alt = "MAD LADS: Everyone's MAD here.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: "The MAD LADS",
    title: "Everyone's MAD here.",
    subtitle: "10,000 MAD LADS on Solana. The collection by Backpack.",
    images: [readFile(join(process.cwd(), "public/video/hero-poster.jpg"))],
  });
}
