"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoHorizontal } from "./Logo";
import { CloseIcon, MenuIcon } from "./Icons";
import { links, nav } from "@/data/site";
import { PHOTO_EVENT, PHOTO_KEY, readHint, type HeaderHint } from "@/lib/auth/hint";
import { thumbImage } from "@/lib/madlads";

// Mirrors the Figma "Nav" component: "On Hero" (transparent, white) until the page
// scrolls, then "On Paper" (cream, ink). Pages without a hero always use "On Paper".
export function Nav({ overHero = false }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Logged-in holder: name and picture from the readable hint cookie (lib/auth/hint.ts).
  const [user, setUser] = useState<HeaderHint | null>(null);
  useEffect(() => setUser(readHint(document.cookie)), [pathname]);

  const light = overHero && !scrolled && !open;
  // Logged in, "Holders" opens the holder's own profile instead of the homepage section.
  const items = user ? nav.map((i) => (i.href === "/#holders" ? { ...i, href: "/holders" } : i)) : nav;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${light ? "bg-transparent text-white" : "border-b border-line bg-paper/95 text-ink backdrop-blur"
        }`}
    >
      <nav className="mx-auto flex h-[72px] items-center justify-between px-4 md:h-[88px] md:px-page" aria-label="Main">
        <Link
          href="/"
          className="shrink-0"
          aria-label="MAD LADS, back to top"
          onClick={(e) => {
            // Always lands on the hero: on the homepage it glides back up (even with a #hash in
            // the URL, or while smooth scroll is paused); elsewhere it navigates home, at the top.
            e.preventDefault();
            setOpen(false);
            if (pathname !== "/") {
              router.push("/", { scroll: true });
              return;
            }
            if (window.location.hash) window.history.replaceState(window.history.state, "", "/");
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const lenis = window.__lenis;
            if (lenis && !reduce) {
              lenis.start();
              lenis.scrollTo(0, { duration: 1.2, force: true });
            } else {
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            }
          }}
        >
          <LogoHorizontal className="h-6 w-auto md:h-[26px]" />
        </Link>

        <PillNav items={items} light={light} pathname={pathname} />

        <div className="flex items-center gap-2">
          {user ? (
            <Account user={user} light={light} />
          ) : (
            <a
              href={links.login}
              className={`rounded-[4px] px-4 py-3 text-[14px] leading-none font-semibold transition-colors md:px-6 md:py-4 md:text-[15px] ${light ? "bg-white text-ink hover:bg-ink hover:text-white" : "bg-accent text-white hover:bg-ink"
                }`}
            >
              Holder login
            </a>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <ul className="border-t border-line bg-paper px-4 pb-6 lg:hidden">
          {items.map((item) => (
            <li key={item.label} className="border-b border-line">
              <Link href={item.href} className="block py-4 text-2xl font-bold tracking-tight" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}

// The logged-in holder: their passport-photo Lad and name; opens a small menu (profile, log out).
function Account({ user, light }: { user: HeaderHint; light: boolean }) {
  const [menu, setMenu] = useState(false);
  const [lad, setLad] = useState<number | null>(user.lad);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(PHOTO_KEY));
      if (saved > 0) setLad(saved);
    } catch { }
    const onPhoto = (e: Event) => setLad((e as CustomEvent<number>).detail);
    window.addEventListener(PHOTO_EVENT, onPhoto);
    return () => window.removeEventListener(PHOTO_EVENT, onPhoto);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setMenu((m) => !m)}
        aria-expanded={menu}
        aria-haspopup="menu"
        aria-label={`${user.name}, account menu`}
        className={`flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 ring-1 transition-colors md:pr-4 ${light ? "ring-white/40 hover:bg-white/10" : "ring-line hover:ring-ink"
          }`}
      >
        <span className="relative block size-9 overflow-hidden rounded-full bg-sunken md:size-10">
          {lad && (
            // Small optimized thumbnail through the site's image optimizer
            <img src={`/_next/image?url=${encodeURIComponent(thumbImage(lad))}&w=96&q=70`} alt="" className="size-full object-cover" />
          )}
        </span>
        <span className="hidden max-w-[140px] truncate text-[15px] font-semibold sm:block">{user.name}</span>
        <svg viewBox="0 0 12 12" className={`size-3 transition-transform ${menu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>
      {menu && (
        <div role="menu" className="absolute right-0 mt-2 w-48 origin-top-right animate-[pop_160ms_ease-out] rounded-xl border border-line bg-surface p-1.5 text-ink shadow-xl">
          <Link href="/holders" role="menuitem" className="block rounded-lg px-3 py-2.5 text-[15px] font-medium hover:bg-sunken" onClick={() => setMenu(false)}>
            My profile
          </Link>
          <form
            action="/api/auth/logout"
            method="post"
            onSubmit={() => {
              try {
                localStorage.removeItem(PHOTO_KEY); // the next holder on this browser starts fresh
              } catch { }
            }}
          >
            <button type="submit" role="menuitem" className="block w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-muted hover:bg-sunken hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Pill navigation (inspired by easyui's "Pill Navigation"): a soft pill glides behind the
// hovered link and rests on the current page's link.
function PillNav({ items, light, pathname }: { items: typeof nav; light: boolean; pathname: string }) {
  const list = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const activeIndex = items.findIndex((i) => i.href === pathname);

  const moveTo = (index: number) => {
    const el = list.current?.querySelectorAll("a")[index];
    if (!el || !list.current) return setPill((p) => ({ ...p, visible: false }));
    const box = list.current.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setPill({ left: r.left - box.left, width: r.width, visible: true });
  };

  useEffect(() => {
    moveTo(activeIndex);
    const onResize = () => moveTo(activeIndex);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // moveTo only reads refs, so it is safe to leave out of the dependencies.
  }, [activeIndex]);

  return (
    <ul ref={list} className="relative hidden items-center gap-1 lg:flex" onMouseLeave={() => moveTo(activeIndex)}>
      <li
        aria-hidden
        className={`pointer-events-none absolute top-0 h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] ${light ? "bg-white/15" : "bg-ink/[0.06]"
          } ${pill.visible ? "opacity-100" : "opacity-0"}`}
        style={{ left: pill.left, width: pill.width }}
      />
      {items.map((item, i) => {
        const active = i === activeIndex;
        return (
          <li key={item.label} className="relative">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onMouseEnter={() => moveTo(i)}
              onFocus={() => moveTo(i)}
              className="block rounded-full px-4 py-2.5 text-[15px] font-medium"
            >
              {item.label}
              {active && <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
