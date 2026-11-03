import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogContentType, ogSize, renderOg } from "@/lib/og";

// Open Graph link preview for this page, generated at build time (see lib/og.tsx).
export const alt = "Mad Lads: the story so far";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return renderOg({
    eyebrow: "Lore",
    title: "The story so far.",
    subtitle: "From a chaotic mint in 2023 to the Backpack token, told in chapters.",
    images: [readFile(join(process.cwd(), "public/lads/1846.jpg"))],
  });
}
