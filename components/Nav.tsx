"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoHorizontal } from "./Logo";
import { CloseIcon, MenuIcon } from "./Icons";
import { links, nav } from "@/data/site";

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

  const light = overHero && !scrolled && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        light ? "bg-transparent text-white" : "border-b border-line bg-paper/95 text-ink backdrop-blur"
      }`}
    >
      <nav className="mx-auto flex h-[72px] items-center justify-between px-4 md:h-[88px] md:px-page" aria-label="Main">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Mad Lads, back to top"
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

        <PillNav light={light} pathname={pathname} />

        <div className="flex items-center gap-2">
          <a
            href={links.matricaLogin}
            className={`rounded-[4px] px-4 py-3 text-[14px] leading-none font-semibold transition-colors md:px-6 md:py-4 md:text-[15px] ${
              light ? "bg-white text-ink hover:bg-ink hover:text-white" : "bg-accent text-white hover:bg-ink"
            }`}
          >
            Login with Matrica
          </a>
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
          {nav.map((item) => (
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

// Pill navigation (inspired by easyui's "Pill Navigation"): a soft pill glides behind the
// hovered link and rests on the current page's link.
function PillNav({ light, pathname }: { light: boolean; pathname: string }) {
  const list = useRef<HTMLUListElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({ left: 0, width: 0, visible: false });
  const activeIndex = nav.findIndex((i) => i.href === pathname);

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
        className={`pointer-events-none absolute top-0 h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] ${
          light ? "bg-white/15" : "bg-ink/[0.06]"
        } ${pill.visible ? "opacity-100" : "opacity-0"}`}
        style={{ left: pill.left, width: pill.width }}
      />
      {nav.map((item, i) => {
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
