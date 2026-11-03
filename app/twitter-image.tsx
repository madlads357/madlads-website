import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

// X (Twitter) link preview for this page, generated at build time (see lib/og.tsx).
export const alt = "Mad Lads: Everyone's mad here.";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: "The Mad Lads",
    title: "Everyone's mad here.",
    subtitle: "10,000 Mad Lads on Solana. The collection by Backpack.",
    images: [readFile(join(process.cwd(), "public/video/hero-poster.jpg"))],
  });
}
