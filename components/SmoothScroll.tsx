"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

// Smooth, inertial scrolling (Lenis — https://github.com/darkroomengineering/lenis), the feel
// most Awwwards-style sites use. Still native scroll under the hood, so CSS scroll-driven
// animations, sticky elements and keyboard scrolling keep working. Off for reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: -96 }, // keep in-page links clear of the fixed nav
      // let nested scrollable panels (dialogs, drawers) scroll natively
      prevent: (node) => node.closest?.("[data-lenis-prevent]") !== null,
    });
    window.__lenis = lenis;
    return () => {
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
  return null;
}
