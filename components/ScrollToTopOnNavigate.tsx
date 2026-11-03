"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// After a normal navigation to another page, start at the top of that page.
// Next.js only scrolls when the new page "isn't visible", which is unreliable with smooth
// scrolling — you could land mid-page. Leaves #anchor links and back/forward
// (scroll restoration) alone. Mounted once in the root layout.
export function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => (fromHistory.current = true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo(0, 0);
    window.__lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
