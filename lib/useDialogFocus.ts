"use client";

import { useEffect, type RefObject } from "react";

// Keyboard focus for pop-ups: on open, focus moves inside (to the element marked
// data-autofocus, else the first button or link); Tab and Shift+Tab cycle inside the pop-up;
// on close, focus goes back to what had it before (usually the button that opened it).
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const before = document.activeElement as HTMLElement | null;
    const focusables = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);

    (root.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? root).focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, [ref]);
}
