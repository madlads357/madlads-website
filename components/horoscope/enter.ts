// Stepping into Madame Fock's caravan: click the crystal ball in the backpack, it swells to the middle of the screen, opens into a swirl
// of red mist that fills everything, and the page changes underneath. The mist stays until the horoscope page is ready, then thins away
// (arrive()), so there is never a white flash in between. Styles: enter.css.
import "./enter.css";
import { playEnter } from "./sound";

const ID = "hz-enter";
const GO_AFTER = 1350; // ms: the swirl covers the whole screen by then

export function enterCaravan(link: HTMLElement, go: () => void) {
  const img = link.querySelector("img");
  if (!img || document.getElementById(ID)) return go();

  const r = img.getBoundingClientRect();
  const slot = link.closest<HTMLElement>("[data-slot]");
  const tilt = (slot && getComputedStyle(slot).getPropertyValue("--r").trim()) || "0deg"; // the ball rests at an angle in the bag
  const sparks = Array.from({ length: 14 }, (_, i) => `<i style="--a:${(i * 137.5) % 360}deg;--d:${22 + ((i * 29) % 40)}vmax;--delay:${(0.65 + (i * 0.07) % 0.6).toFixed(2)}s;--s:${8 + ((i * 5) % 9)}px"></i>`).join("");

  const root = document.createElement("div");
  root.id = ID;
  root.className = "hz-enter";
  root.setAttribute("aria-hidden", "true");
  root.style.setProperty("--dx", `${innerWidth / 2 - (r.left + r.width / 2)}px`);
  root.style.setProperty("--dy", `${innerHeight / 2 - (r.top + r.height / 2)}px`);
  root.innerHTML =
    `<div class="hz-enter-dim"></div>` +
    `<img class="hz-enter-ball" src="${img.currentSrc || img.src}" alt="" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;--r:${tilt}">` +
    `<div class="hz-enter-iris"><div class="hz-enter-swirl"></div><div class="hz-enter-core"></div><div class="hz-enter-sparks">${sparks}</div></div>`;
  document.body.appendChild(root);
  img.style.visibility = "hidden"; // the copy takes over from the real one

  playEnter();
  setTimeout(go, GO_AFTER);
  setTimeout(() => (root.style.pointerEvents = "none"), GO_AFTER + 250); // the mist covers the screen: it must never swallow clicks if the page is slow
  // If the horoscope page has not taken the mist over (the login ran out and the page sent us back, a bad connection): lift it, put the ball back.
  setTimeout(() => {
    if (!document.getElementById(ID)) return;
    img.style.visibility = "";
    root.classList.add("hz-enter-out");
    setTimeout(() => root.remove(), 1500);
  }, 7000);
}

// On the horoscope page, once it is ready: the mist thins away. True if there was mist (so the room can "arrive" too).
export function arrive() {
  const root = document.getElementById(ID);
  if (!root) return false;
  root.classList.add("hz-enter-out");
  setTimeout(() => root.remove(), 1500);
  return true;
}
