import Image from "next/image";
import type { ArtPiece } from "@/data/art";

// Mirrors the Figma "Art Card / 1of1" component. `imageClass` sets the image box size/aspect.
export function ArtCard({
  piece,
  imageClass = "aspect-[4/5]",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  placeholder,
}: {
  piece: ArtPiece | null;
  imageClass?: string;
  sizes?: string;
  placeholder?: { kind: string; name: string };
}) {
  const kind = piece?.kind ?? placeholder?.kind ?? "";
  const name = piece?.name ?? placeholder?.name ?? "";
  return (
    <figure className="reveal group flex flex-col gap-3.5">
      <div className={`relative overflow-hidden rounded-[4px] bg-sunken ${imageClass}`}>
        {piece ? (
          <Image
            src={piece.src}
            alt={piece.alt}
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center border-[1.5px] border-dashed border-line text-sm text-muted">
            Coming soon
          </div>
        )}
      </div>
      <figcaption className="flex flex-col gap-1.5">
        <span className="t-eyebrow text-accent">{kind}</span>
        <span className="text-[18px] leading-tight font-semibold tracking-tight md:text-[20px]">{name}</span>
      </figcaption>
    </figure>
  );
}
