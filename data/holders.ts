import type { ComponentType } from "react";
import { GiftIcon, ToolIcon, UsersIcon } from "@/components/Icons";

// What holders get, most important first: the crew, then collabs/giveaways, then the tools.
// image: the card photo on the homepage. objectPosition (optional, a Tailwind class): which part of the
// photo shows, e.g. to keep the MAD LADS neon of the Seoul pop-up photo in view.
// Shown on the homepage (Holders section) and in the holder area. Only list what holders really get today.
export type Perk = { Icon: ComponentType<{ className?: string }>; title: string; text: string; image: string; objectPosition?: string; tags?: string[] };

export const perks: Perk[] = [
  { Icon: UsersIcon, title: "A crew of LADS", text: "Hold a LAD and you’re in. Meet the misfits on Discord, at meetups and all over the world.", image: "/irl/rooftop.jpg" },
  { Icon: GiftIcon, title: "Collabs & giveaways", text: "Collabs and giveaways for holders only, announced in the Discord.", image: "/lore/staking-art.jpg" },
  {
    Icon: ToolIcon,
    title: "Community tools",
    text: "Tools made for the LADS, one login away.",
    image: "/lore/seoul-popup.jpg",
    objectPosition: "object-[50%_66%]",
    tags: ["MAD LADS Passport", "Dressing Room", "Meme vault"],
  },
];
