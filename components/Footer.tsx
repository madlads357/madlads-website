import Link from "next/link";
import { LogoHorizontal } from "./Logo";
import { links, nav } from "@/data/site";

type FooterLink = { label: string; href: string; note?: string; external?: boolean };

// Footer link columns. External links open in a new tab and get a ↗.
const columns: { title: string; items: FooterLink[] }[] = [
  { title: "Explore", items: [...nav, { label: "FAQ", href: "/#faq" }] },
  {
    title: "Community",
    items: [
      { label: "X", href: links.x, external: true },
      { label: "Discord", href: links.discord, external: true },
      { label: "Mad News", href: links.newsletter, external: true },
    ],
  },
  {
    title: "Trading",
    items: [
      { label: "Magic Eden", href: links.magicEden, external: true },
      { label: "Tensor", href: links.tensor, external: true },
      { label: "FoxySwap", href: links.foxySwap, note: "P2P", external: true },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Press kit", href: links.pressKit, external: true },
      { label: "press@madlads.com", href: links.pressEmail },
      { label: "Backpack", href: links.backpack, external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface px-4 pt-20 pb-10 md:px-page md:pt-24">
      <div className="overflow-hidden">
        <LogoHorizontal className="reveal-rise h-auto w-full max-w-[620px] text-red" />
      </div>

      <nav aria-label="Footer" className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-4">
            <p className="t-eyebrow text-muted">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.items.map((item) => (
                <li key={item.label}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-[15px] font-medium hover:text-accent">
                      {item.label}
                      {item.note && <span className="rounded-full bg-sunken px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">{item.note}</span>}
                      <span aria-hidden className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent">
                        ↗
                      </span>
                    </a>
                  ) : item.href.startsWith("mailto:") ? (
                    <a href={item.href} className="text-[15px] font-medium hover:text-accent">
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-[15px] font-medium hover:text-accent">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-14 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} Mad Lads. A Backpack collection.</p>
        <p className="flex gap-4">
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
        </p>
      </div>
    </footer>
  );
}
