import Link from "next/link";
import { LogoHorizontal } from "./Logo";
import { links, nav } from "@/data/site";

const external = [
  { label: "X", href: links.x },
  { label: "Discord", href: links.discord },
  { label: "Magic Eden", href: links.magicEden },
  { label: "Tensor", href: links.tensor },
  { label: "FoxySwap (P2P)", href: links.foxySwap },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-4 pt-20 pb-10 md:px-page md:pt-24">
      <div className="overflow-hidden">
        <LogoHorizontal className="reveal-rise h-auto w-full max-w-[620px] text-red" />
      </div>

      <div className="mt-14 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {nav.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className="text-[15px] font-medium hover:text-accent">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {external.map((item) => (
            <li key={item.label}>
              <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium hover:text-accent">
                {item.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Mad Lads. A Backpack collection.</p>
        <p>Terms · Privacy</p>
      </div>
    </footer>
  );
}
