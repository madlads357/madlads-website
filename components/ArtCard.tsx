import Image from "next/image";
import type { CSSProperties } from "react";
import type { ArtPiece } from "@/data/art";
import { HoloTilt } from "./HoloTilt";

// Mirrors the Figma "Art Card / 1of1" component. `imageClass` sets the image box size/aspect.
// On scroll: the card rises in (`i` staggers cards in a row), the image unveils like a curtain
// and settles from a slight zoom. Hover still zooms the image.
// `holo`: trading-card tilt + foil shine (used for the 1/1s).
export function ArtCard({
  piece,
  imageClass = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  placeholder,
  i = 0,
  holo = false,
}: {
  piece: ArtPiece | null;
  imageClass?: string;
  sizes?: string;
  placeholder?: { kind: string; name: string };
  i?: number;
  holo?: boolean;
}) {
  const kind = piece?.kind ?? placeholder?.kind ?? "";
  const name = piece?.name ?? placeholder?.name ?? "";
  const zoom = holo ? "" : "group-hover:scale-[1.04]";
  const box = (
      <div className={`reveal-curtain relative overflow-hidden rounded-[4px] bg-sunken ${imageClass}`}>
        {piece ? (
          <div className="reveal-zoom absolute inset-0">
            <Image
              src={piece.src}
              alt={piece.alt}
              fill
              sizes={sizes}
              className={`object-cover transition-transform duration-700 ease-out ${zoom}`}
            />
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center border-[1.5px] border-dashed border-line text-sm text-muted">
            Coming soon
          </div>
        )}
      </div>
  );
  return (
    <figure className="reveal group flex flex-col gap-3.5" style={{ "--i": i } as CSSProperties}>
      {holo && piece ? <HoloTilt>{box}</HoloTilt> : box}
      <figcaption className="flex flex-col gap-1.5">
        <span className="t-eyebrow text-accent">{kind}</span>
        <span className="text-[18px] leading-tight font-semibold tracking-tight md:text-[20px]">{name}</span>
      </figcaption>
    </figure>
  );
}
