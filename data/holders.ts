import type { ComponentType } from "react";
import { GiftIcon, ToolIcon, UsersIcon } from "@/components/Icons";

// What holders get, most important first: the crew, then collabs/giveaways, then the tools.
// image: the blurred background of the card on the homepage.
// objectPosition / overlay (optional, Tailwind classes): which part of the photo shows, and a lighter gradient,
// e.g. to keep the MAD LADS neon of the Seoul pop-up photo in view.
// Shown on the homepage (Holders section) and in the holder area. Only list what holders really get today.
export type Perk = { Icon: ComponentType<{ className?: string }>; title: string; text: string; image: string; objectPosition?: string; overlay?: string; tags?: string[] };

export const perks: Perk[] = [
  { Icon: UsersIcon, title: "A crew of LADS", text: "Hold a LAD and you’re in. Meet the misfits on Discord, at meetups and all over the world.", image: "/irl/rooftop.jpg" },
  { Icon: GiftIcon, title: "Collabs & giveaways", text: "Holder-only collabs and giveaways, dropped in the Discord.", image: "/lore/staking-art.jpg" },
  {
    Icon: ToolIcon,
    title: "Community tools",
    text: "Tools made for the LADS, one login away.",
    image: "/lore/seoul-popup.jpg",
    objectPosition: "object-[50%_66%]",
    overlay: "from-black/90 via-black/40 to-black/10",
    tags: ["MAD LADS Passport", "Dressing Room", "Meme vault"],
  },
];
