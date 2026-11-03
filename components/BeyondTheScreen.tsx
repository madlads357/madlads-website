import { BeyondVideos } from "./beyond/Shared";
import { ReelGallery } from "./beyond/ReelGallery";

// "Beyond the screen" — Mad Lads in real life: a pinned horizontal photo reel
// (scroll down → photos glide sideways) + meetup videos (lite YouTube, plays in a lightbox).
// Content: data/irl.ts · photos: public/irl.
export function BeyondTheScreen() {
  return (
    <section aria-labelledby="irl-title" className="bg-ink text-white">
      <ReelGallery />
      <BeyondVideos />
    </section>
  );
}
