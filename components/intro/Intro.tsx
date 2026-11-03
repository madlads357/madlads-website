import { IntroOverlays } from "./IntroOverlays";

// "Bolt strike" intro for the homepage (~1.8 s).
// Plays every time the site is opened or reloaded on the homepage (not on client-side
// navigation back to it), never for prefers-reduced-motion. Set INTRO_ENABLED to false to
// switch it off.
export const INTRO_ENABLED = true;

// Inline script placed in the root layout's <head>: it runs before the first paint, so the
// overlay is there from the first frame and the page underneath is never glimpsed. The root
// layout only renders on a real page load, so in-site navigation never replays the intro.
export const introDecideScript = `(function(){try{
if(${INTRO_ENABLED}&&location.pathname==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.setAttribute('data-intro','bolt');
}catch(e){}})();`;

export function Intro() {
  return <IntroOverlays />;
}
