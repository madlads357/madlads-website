import { irlPlaylist, irlVideos } from "@/data/irl";
import { Button } from "../Button";
import { VideoGrid } from "../VideoGrid";

// Section header. `row` puts the intro next to the title on desktop (saves height in the pinned reel).
export function BeyondHeader({ className = "", row = false }: { className?: string; row?: boolean }) {
  return (
    <header
      className={`flex flex-col gap-4 px-4 md:px-page ${row ? "md:flex-row md:items-end md:justify-between md:gap-12" : "max-w-[640px]"} ${className}`}
    >
      <div className="flex flex-col gap-4">
        <p className="t-eyebrow text-white/60">IRL</p>
        <h2 id="irl-title" className={row ? "t-display-l md:text-[clamp(2.5rem,4.4vw,4rem)]" : "t-display-l"}>
          Beyond the
          <br />
          <span className="text-red">screen.</span>
        </h2>
      </div>
      <p className={`t-body-l text-white/70 ${row ? "md:max-w-[420px] md:pb-2" : ""}`}>
        From Shibuya to the summit of Mt Fuji, the LADS show up for real: meetups, booths, parties, even a wedding.
      </p>
    </header>
  );
}

export function BeyondVideos() {
  return (
    <div className="px-4 pt-8 pb-24 md:px-page md:pb-section">
      <div className="reveal mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <p className="t-eyebrow text-white/60">On film</p>
          <h3 className="t-h2">Watch the meetups</h3>
        </div>
        <Button href={irlPlaylist} variant="inverse-outline" external>
          Full playlist on YouTube ↗
        </Button>
      </div>
      <VideoGrid videos={irlVideos} />
    </div>
  );
}
