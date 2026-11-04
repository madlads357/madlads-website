import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

// X (Twitter) link preview for this page, generated at build time (see lib/og.tsx).
export const alt = "All 9,971 MAD LADS";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: "Explore",
    title: "All 9,971 MAD LADS.",
    subtitle: "Search by number and filter by every trait: LADS, Lassies, Skulls and 1/1s.",
    images: [readFile(join(process.cwd(), "public/lads/9366.jpg")), readFile(join(process.cwd(), "public/lads/4144.jpg")), readFile(join(process.cwd(), "public/lads/1846.jpg")), readFile(join(process.cwd(), "public/lads/5655.jpg"))],
  });
}
